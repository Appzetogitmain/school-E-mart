const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const paymentRepository = require('../repositories/payment.repository');
const paymentGateway = require('../../../services/paymentGateway');
const { randomHex } = require('../../../utils/crypto');
const Payment = require('../../../database/models/Payment');
const Order = require('../../../database/models/Order');
const { triggerService } = require('../../../services/notification');

const paymentService = {
  async createPaymentForOrder(order, { method, amountPaise, session = null }) {
    // The gateway collects only what the wallet did not cover. Defaults to the
    // full total when no explicit amount is given (unchanged legacy behaviour).
    const chargePaise = amountPaise == null ? order.totalPaise : amountPaise;
    const idempotencyKey = `order-${order._id}-${randomHex(8)}`;
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
    { razorpayPaymentId, razorpayOrderId, razorpaySignature, session = null } = {}
  ) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (payment.status === 'captured') return payment;

    let gatewayPaymentId;
    const opts = session ? { session } : {};

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
    } else {
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

  async initiateRefund(orderId, { amountPaise, reason, actorUserId }, { session = null } = {}) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (!['captured', 'authorized', 'partially_refunded'].includes(payment.status)) {
      throw new BadRequestError('Payment is not refundable', null, 'PAYMENT_NOT_REFUNDABLE');
    }

    const refundAmount = amountPaise || payment.amountPaise;
    if (refundAmount > payment.amountPaise) {
      throw new BadRequestError('Refund amount exceeds payment', null, 'REFUND_AMOUNT_EXCEEDED');
    }

    const gatewayRefund = await paymentGateway.initiateRefund({
      gatewayPaymentId: payment.gatewayPaymentId || payment.gatewayOrderId,
      amountPaise: refundAmount,
      reason,
      gateway: payment.gateway,
    });

    const refundEntry = {
      refundId: gatewayRefund.refundId,
      amountPaise: refundAmount,
      at: new Date(),
      reason,
      status: 'initiated',
      requestedBy: actorUserId,
    };

    const newStatus = refundAmount >= payment.amountPaise ? 'refunded' : 'partially_refunded';
    const opts = session ? { session } : {};
    return Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: { status: newStatus },
        $push: { refunds: refundEntry },
      },
      { new: true, ...opts }
    ).lean();
  },

  async approveRefund(orderId, refundId, actorUserId) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');

    const refund = (payment.refunds || []).find((r) => r.refundId === refundId);
    if (!refund) throw new NotFoundError('Refund not found', 'REFUND_NOT_FOUND');
    if (refund.status === 'completed') {
      throw new ConflictError('Refund already completed', 'REFUND_ALREADY_COMPLETED');
    }

    return Payment.findOneAndUpdate(
      { _id: payment._id, 'refunds.refundId': refundId },
      {
        $set: {
          'refunds.$.status': 'completed',
          'refunds.$.approvedBy': actorUserId,
          'refunds.$.approvedAt': new Date(),
        },
      },
      { new: true }
    ).lean();
  },

  async rejectRefund(orderId, refundId, reason, actorUserId) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');

    return Payment.findOneAndUpdate(
      { _id: payment._id, 'refunds.refundId': refundId },
      {
        $set: {
          'refunds.$.status': 'rejected',
          'refunds.$.rejectionReason': reason,
          'refunds.$.rejectedBy': actorUserId,
          'refunds.$.rejectedAt': new Date(),
        },
      },
      { new: true }
    ).lean();
  },
};

module.exports = paymentService;
