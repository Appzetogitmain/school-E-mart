const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const paymentRepository = require('../repositories/payment.repository');
const paymentGateway = require('../../../services/paymentGateway');
const Payment = require('../../../database/models/Payment');
const Order = require('../../../database/models/Order');
const logger = require('../../../common/logger');
const { triggerService } = require('../../../services/notification');

/**
 * Whether an online payment may be "captured" through the internal stub gateway.
 *
 * Only ever true where no real money exists: the automated tests, and a local dev
 * machine that has deliberately opted in. In every other environment a missing
 * Razorpay configuration must fail the payment rather than hand out a free capture.
 */
const allowStubCapture = () =>
  process.env.NODE_ENV === 'test' || process.env.ALLOW_STUB_PAYMENTS === 'true';

/** Money already given back to the customer for this payment, settled only. */
const settledRefundPaise = (payment) =>
  (payment.refunds || [])
    .filter((r) => r.status === 'processed')
    .reduce((sum, r) => sum + (r.amountPaise || 0), 0);

/** Money promised back but not yet settled — counts against the refundable balance. */
const inFlightRefundPaise = (payment) =>
  (payment.refunds || [])
    .filter((r) => ['requested', 'pending'].includes(r.status))
    .reduce((sum, r) => sum + (r.amountPaise || 0), 0);

const paymentService = {
  allowStubCapture,
  settledRefundPaise,
  inFlightRefundPaise,

  async createPaymentForOrder(order, { method, amountPaise, session = null }) {
    // The gateway collects only what the wallet did not cover. Defaults to the
    // full total when no explicit amount is given (unchanged legacy behaviour).
    const chargePaise = amountPaise == null ? order.totalPaise : amountPaise;

    // Derived from what the payment IS, not from a fresh random string. The key used to
    // be `order-<id>-<random>`, which differed on every call — so the lookup below could
    // never match and the idempotency this function advertises did not exist: a retried
    // checkout silently created a second Payment (and a second gateway intent) for the
    // same money. An RFQ order legitimately has two payments (advance, then remainder),
    // and those differ by amount, so the amount is part of the key.
    const idempotencyKey = `order-${order._id}-${method === 'cod' ? 'cod' : 'online'}-${chargePaise}`;
    const existing = await paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;

    const opts = session ? { session } : {};

    // Fully wallet-paid: nothing to collect, so skip the gateway and record a
    // captured wallet payment directly.
    if (chargePaise <= 0) {
      const [walletPayment] = await Payment.create(
        [
          {
            orderId: order._id,
            userId: order.userId,
            amountPaise: 0,
            currency: 'INR',
            method: 'wallet',
            gateway: 'internal',
            status: 'captured',
            idempotencyKey,
          },
        ],
        opts
      );
      return walletPayment;
    }

    const intent = await paymentGateway.createPaymentIntent({
      orderId: order._id,
      amountPaise: chargePaise,
      method: method === 'cod' ? 'cod' : 'upi',
      // Carried into the gateway's own record so a dashboard row can be matched
      // to an order by the same number the customer and the admin panel see.
      orderNumber: order.orderNumber,
      userId: order.userId,
    });

    const [payment] = await Payment.create(
      [
        {
          orderId: order._id,
          userId: order.userId,
          amountPaise: chargePaise,
          currency: 'INR',
          method: method === 'cod' ? 'cod' : 'upi',
          gateway: intent.gateway,
          gatewayOrderId: intent.gatewayOrderId,
          status: method === 'cod' ? 'authorized' : 'initiated',
          idempotencyKey,
        },
      ],
      opts
    );

    return payment;
  },

  async confirmPayment(
    orderId,
    { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature, session = null } = {}
  ) {
    const opts = session ? { session } : {};
    // Within an active transaction (e.g. COD confirmation right after order
    // creation), the payment was just inserted in this same session — a
    // session-less read would miss it under snapshot isolation and 404 here.
    //
    // `findByOrderId` is a bare findOne({orderId}) — fine while an order only
    // ever has one Payment, but an RFQ order gets a second one for the
    // remainder after the advance is captured. Callers that know exactly
    // which payment they mean (advance vs remainder) pass paymentId to
    // target it directly instead of relying on find-the-only-one-for-order.
    const payment = paymentId
      ? await paymentRepository.findById(paymentId, {}, opts)
      : await paymentRepository.findByOrderId(orderId, opts);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (String(payment.orderId) !== String(orderId)) {
      throw new BadRequestError('Payment does not belong to this order', null, 'PAYMENT_ORDER_MISMATCH');
    }
    if (payment.status === 'captured') return payment;

    let gatewayPaymentId;

    if (payment.gateway === 'razorpay') {
      if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature) {
        throw new BadRequestError(
          'Razorpay payment details are required',
          null,
          'RAZORPAY_DETAILS_REQUIRED'
        );
      }
      if (payment.gatewayOrderId !== razorpayOrderId) {
        throw new BadRequestError('Payment order mismatch', null, 'PAYMENT_ORDER_MISMATCH');
      }
      const valid = paymentGateway.verifyPaymentSignature({
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      });
      if (!valid) {
        throw new BadRequestError('Invalid payment signature', null, 'INVALID_PAYMENT_SIGNATURE');
      }
      gatewayPaymentId = razorpayPaymentId;
    } else if (payment.method === 'cod' || payment.method === 'wallet') {
      // COD is "captured" at placement because the courier collects later, and a
      // wallet payment was already debited from a real balance. Neither involves a
      // gateway, so there is nothing to verify.
      const capture = await paymentGateway.capturePayment({
        gatewayOrderId: payment.gatewayOrderId,
        gateway: payment.gateway,
      });
      gatewayPaymentId = capture.gatewayPaymentId;
    } else {
      // An online payment on the internal gateway means Razorpay was not configured
      // when the intent was created. The internal gateway is a stub: its
      // capturePayment fabricates an id and reports success without any money
      // moving. Capturing through it marked online orders paid for free — and the
      // checkout page calls this endpoint with an empty body in exactly that case,
      // so the hole was reachable by every customer, not just an attacker.
      //
      // Outside test/dev this is a misconfiguration, and the safe response to
      // "payments are not set up" is to refuse the payment, never to grant it.
      if (!allowStubCapture()) {
        throw new BadRequestError(
          'Online payments are not available right now. Please try again later or choose Cash on Delivery.',
          null,
          'PAYMENT_GATEWAY_UNAVAILABLE'
        );
      }
      const capture = await paymentGateway.capturePayment({
        gatewayOrderId: payment.gatewayOrderId,
        gateway: payment.gateway,
      });
      gatewayPaymentId = capture.gatewayPaymentId;
    }

    const updated = await Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          status: 'captured',
          gatewayPaymentId,
          gatewayStatus: 'captured',
          amountCapturedPaise: payment.amountPaise,
          lastSyncedAt: new Date(),
          ...(razorpaySignature ? { gatewaySignature: razorpaySignature } : {}),
        },
      },
      { new: true, ...opts }
    ).lean();

    const order = await Order.findById(orderId).lean();
    if (order) {
      triggerService.notifyPaymentSuccess(order);
    }

    return updated;
  },

  async getPaymentByOrder(orderId) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    return payment;
  },

  /**
   * Ask the gateway to return money to the customer.
   *
   * Three things changed here, each of which was independently capable of making
   * the admin panel disagree with the Razorpay dashboard:
   *
   *  - It refunds against the payment that actually holds the money. It used to
   *    take whichever row findOne returned, and fall back to the gateway ORDER id
   *    when no payment id was stored — an id Razorpay's refund API rejects
   *    outright, producing an error that the caller then swallowed.
   *  - It records the gateway's own status rather than assuming success. A refund
   *    is 'pending' until the gateway says 'processed'; every refund in production
   *    was written as final on creation and never revisited.
   *  - It refuses to over-refund, counting both settled and in-flight refunds.
   *
   * It deliberately does NOT run inside a Mongo transaction: an external call
   * that moves real money must not be rolled back by a later database abort.
   */
  async initiateRefund(orderId, { amountPaise, reason, actorUserId, paymentId } = {}) {
    const payment = paymentId
      ? await Payment.findById(paymentId).lean()
      : await paymentRepository.findCapturedForOrder(orderId);

    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (String(payment.orderId) !== String(orderId)) {
      throw new BadRequestError(
        'Payment does not belong to this order',
        null,
        'PAYMENT_ORDER_MISMATCH'
      );
    }
    if (!['captured', 'authorized', 'partially_refunded'].includes(payment.status)) {
      throw new BadRequestError('Payment is not refundable', null, 'PAYMENT_NOT_REFUNDABLE');
    }

    const alreadyRefunded = settledRefundPaise(payment) + inFlightRefundPaise(payment);
    const refundable = Math.max(0, (payment.amountPaise || 0) - alreadyRefunded);
    const refundAmount = amountPaise || refundable;

    if (refundAmount <= 0) {
      throw new BadRequestError(
        'Nothing left to refund on this payment',
        null,
        'REFUND_ALREADY_FULL'
      );
    }
    if (refundAmount > refundable) {
      throw new BadRequestError(
        `Refund of ${refundAmount} paise exceeds the ${refundable} paise still refundable`,
        null,
        'REFUND_AMOUNT_EXCEEDED'
      );
    }

    // Razorpay refunds are issued against the payment id (pay_...), never the
    // order id. Without a payment id there is nothing to refund, and pretending
    // otherwise is how a refund silently failed while the order was marked
    // refunded anyway.
    if (payment.gateway === 'razorpay' && !payment.gatewayPaymentId) {
      throw new BadRequestError(
        'This payment has no gateway payment id, so it cannot be refunded automatically. ' +
          'Reconcile it against Razorpay first.',
        null,
        'REFUND_MISSING_GATEWAY_PAYMENT_ID'
      );
    }

    const order = await Order.findById(orderId).lean();

    let gatewayRefund;
    try {
      gatewayRefund = await paymentGateway.initiateRefund({
        gatewayPaymentId: payment.gatewayPaymentId,
        amountPaise: refundAmount,
        reason,
        gateway: payment.gateway,
        notes: { orderNumber: (order && order.orderNumber) || '', orderId: String(orderId) },
      });
    } catch (error) {
      // Surfaced, not swallowed. A failed refund that leaves the order marked
      // "refunded" is precisely the mismatch this work exists to remove.
      logger.error('Refund failed at the gateway', {
        orderId: String(orderId),
        paymentId: String(payment._id),
        amountPaise: refundAmount,
        error: error.message,
      });
      await Payment.findByIdAndUpdate(payment._id, {
        $set: {
          'reconciliation.status': 'mismatch',
          'reconciliation.code': 'REFUND_FAILED',
          'reconciliation.detail': `Refund of ${refundAmount} paise was rejected: ${error.message}`,
          'reconciliation.detectedAt': new Date(),
        },
      });
      throw new BadRequestError(
        `The payment gateway rejected this refund: ${error.message}`,
        null,
        'REFUND_GATEWAY_ERROR'
      );
    }

    const refundStatus = gatewayRefund.status === 'processed' ? 'processed' : 'pending';
    const refundEntry = {
      refundId: gatewayRefund.refundId,
      amountPaise: refundAmount,
      at: new Date(),
      reason,
      status: refundStatus,
      settledAt: refundStatus === 'processed' ? new Date() : undefined,
      requestedBy: actorUserId,
      source: 'admin',
    };

    const updated = await Payment.findByIdAndUpdate(
      payment._id,
      { $push: { refunds: refundEntry } },
      { new: true }
    ).lean();

    await this.recomputeRefundState(payment._id);
    return Payment.findById(payment._id).lean() || updated;
  },

  /**
   * Derive the payment's and order's refund status from the refund array.
   *
   * Recomputed from scratch every time rather than incremented, so a duplicated
   * webhook, a retry, or a refund that later fails cannot leave the totals wrong.
   * Only money the gateway has actually settled counts as refunded.
   */
  async recomputeRefundState(paymentId) {
    const payment = await Payment.findById(paymentId).lean();
    if (!payment) return null;

    const settled = settledRefundPaise(payment);
    const capturedPaise = payment.amountPaise || 0;

    let status = payment.status;
    if (settled <= 0) {
      if (['refunded', 'partially_refunded'].includes(payment.status)) status = 'captured';
    } else if (settled >= capturedPaise) {
      status = 'refunded';
    } else {
      status = 'partially_refunded';
    }

    await Payment.findByIdAndUpdate(paymentId, {
      $set: { status, amountRefundedPaise: settled },
    });

    const order = await Order.findById(payment.orderId).lean();
    if (!order) return null;

    // The order only claims to be refunded once money has actually settled back.
    const owed = Math.max(0, (order.totalPaise || 0) - (order.walletAmountPaise || 0));
    let orderPaymentStatus = order.paymentStatus;
    if (settled > 0) {
      orderPaymentStatus = settled >= owed ? 'refunded' : 'partially_refunded';
    }
    if (orderPaymentStatus !== order.paymentStatus) {
      await Order.findByIdAndUpdate(order._id, { $set: { paymentStatus: orderPaymentStatus } });
    }
    return orderPaymentStatus;
  },

  /**
   * Confirm that a refund has settled.
   *
   * This is an operational acknowledgement, not a gateway action — the money was
   * already sent when the refund was initiated. It re-reads the gateway before
   * agreeing, so an admin cannot mark a refund complete that Razorpay has not
   * actually processed. Approving blind is what produced four production refunds
   * that read as done while the gateway still had them pending.
   */
  async approveRefund(orderId, refundId, actorUserId) {
    const payment = await paymentRepository.findByRefundId(orderId, refundId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');

    const refund = (payment.refunds || []).find((r) => r.refundId === refundId);
    if (!refund) throw new NotFoundError('Refund not found', 'REFUND_NOT_FOUND');
    if (refund.status === 'processed') {
      throw new ConflictError('Refund already settled', 'REFUND_ALREADY_COMPLETED');
    }

    // Ask the gateway before agreeing the money has moved.
    if (payment.gateway === 'razorpay' && payment.gatewayPaymentId) {
      const reconciliationService = require('./reconciliation.service');
      await reconciliationService.syncRefunds(payment._id);
      const fresh = await Payment.findById(payment._id).lean();
      const synced = (fresh.refunds || []).find((r) => r.refundId === refundId);
      if (synced && synced.status !== 'processed') {
        throw new BadRequestError(
          `The gateway still reports this refund as "${synced.status}". It cannot be marked settled yet.`,
          null,
          'REFUND_NOT_SETTLED_AT_GATEWAY'
        );
      }
    }

    await Payment.findOneAndUpdate(
      { _id: payment._id, 'refunds.refundId': refundId },
      {
        $set: {
          'refunds.$.status': 'processed',
          'refunds.$.settledAt': new Date(),
          'refunds.$.approvedBy': actorUserId,
          'refunds.$.approvedAt': new Date(),
        },
      }
    );

    await this.recomputeRefundState(payment._id);
    return Payment.findById(payment._id).lean();
  },

  /**
   * Record that a refund request was turned down.
   *
   * Only meaningful for a refund that has not reached the gateway — once money
   * has been sent it cannot be un-sent, so rejecting a pending or processed
   * gateway refund is refused rather than quietly recorded as rejected.
   */
  async rejectRefund(orderId, refundId, reason, actorUserId) {
    const payment = await paymentRepository.findByRefundId(orderId, refundId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');

    const refund = (payment.refunds || []).find((r) => r.refundId === refundId);
    if (!refund) throw new NotFoundError('Refund not found', 'REFUND_NOT_FOUND');
    if (['processed', 'pending'].includes(refund.status)) {
      throw new BadRequestError(
        'This refund has already been sent to the payment gateway and cannot be rejected.',
        null,
        'REFUND_ALREADY_SENT'
      );
    }

    await Payment.findOneAndUpdate(
      { _id: payment._id, 'refunds.refundId': refundId },
      {
        $set: {
          'refunds.$.status': 'rejected',
          'refunds.$.rejectionReason': reason,
          'refunds.$.rejectedBy': actorUserId,
          'refunds.$.rejectedAt': new Date(),
        },
      }
    );

    await this.recomputeRefundState(payment._id);
    return Payment.findById(payment._id).lean();
  },
};

module.exports = paymentService;
