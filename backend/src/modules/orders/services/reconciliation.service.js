const Payment = require('../../../database/models/Payment');
const Order = require('../../../database/models/Order');
const paymentGateway = require('../../../services/paymentGateway');
const logger = require('../../../common/logger');
const { NotFoundError } = require('../../../common/errors');

/**
 * Reconciliation: ask the gateway what actually happened, and make our books
 * agree with it — or, where they cannot, record the disagreement so a human
 * sees it.
 *
 * This exists because nothing in the system ever asked Razorpay anything. An
 * order's payment state was written only by the customer's own browser calling
 * the confirm endpoint, plus a webhook that in production had never once been
 * delivered. Any customer who paid and then closed the tab left money captured
 * at the gateway and an order here that looked unpaid — and thirty minutes
 * later the sweeper cancelled it. The two dashboards disagreed because only one
 * of them was ever looking at the money.
 *
 * Every path is read-then-write against the gateway's answer, and is safe to
 * run repeatedly: syncing a payment that is already correct changes nothing.
 */

// Razorpay payment states that mean the customer's money is actually ours.
const CAPTURED_STATES = new Set(['captured']);
// ...and the state where it is held but not yet taken.
const AUTHORIZED_STATES = new Set(['authorized']);

const MISMATCH = {
  SHORT_CAPTURE: 'SHORT_CAPTURE',
  CAPTURED_ON_CANCELLED_ORDER: 'CAPTURED_ON_CANCELLED_ORDER',
  REFUND_FAILED: 'REFUND_FAILED',
  GATEWAY_UNREACHABLE: 'GATEWAY_UNREACHABLE',
  AUTHORIZED_NOT_CAPTURED: 'AUTHORIZED_NOT_CAPTURED',
};

const flagMismatch = async (paymentId, code, detail) =>
  Payment.findByIdAndUpdate(paymentId, {
    $set: {
      'reconciliation.status': 'mismatch',
      'reconciliation.code': code,
      'reconciliation.detail': detail,
      'reconciliation.detectedAt': new Date(),
    },
  });

const reconciliationService = {
  MISMATCH,

  /**
   * Pull the gateway's view of one payment and write it back.
   *
   * Returns a description of what the gateway said and what we did about it.
   * Never throws for an ordinary "still unpaid" answer — that is a legitimate
   * result, not an error.
   */
  async syncPayment(paymentOrId, { actorUserId = null } = {}) {
    const payment =
      typeof paymentOrId === 'object' && paymentOrId && paymentOrId._id
        ? paymentOrId
        : await Payment.findById(paymentOrId).lean();
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');

    // The stub gateway has no external truth; there is nothing to reconcile.
    if (payment.gateway !== 'razorpay') {
      return { changed: false, status: payment.status, reason: 'NOT_A_GATEWAY_PAYMENT' };
    }
    if (!paymentGateway.isRazorpayEnabled()) {
      return { changed: false, status: payment.status, reason: 'GATEWAY_NOT_CONFIGURED' };
    }

    let gatewayPayments = [];
    try {
      // Ask by our order id rather than by payment id: a payment we never heard
      // about (the customer paid, the callback never ran) has no gatewayPaymentId
      // stored here at all, so it can only be found through the order.
      gatewayPayments = await paymentGateway.fetchPaymentsForOrder(
        payment.gatewayOrderId,
        'razorpay'
      );
    } catch (error) {
      logger.error('Reconciliation: gateway fetch failed', {
        paymentId: String(payment._id),
        gatewayOrderId: payment.gatewayOrderId,
        error: error.message,
      });
      await flagMismatch(payment._id, MISMATCH.GATEWAY_UNREACHABLE, error.message);
      return { changed: false, status: payment.status, error: error.message };
    }

    const captured = gatewayPayments.filter((p) => CAPTURED_STATES.has(p.status));
    const authorized = gatewayPayments.filter((p) => AUTHORIZED_STATES.has(p.status));
    const capturedPaise = captured.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const refundedPaise = gatewayPayments.reduce(
      (sum, p) => sum + (Number(p.amount_refunded) || 0),
      0
    );
    const winner = captured[0] || authorized[0] || gatewayPayments[0] || null;

    const base = {
      gatewayStatus: (winner && winner.status) || 'created',
      amountCapturedPaise: capturedPaise,
      amountRefundedPaise: refundedPaise,
      lastSyncedAt: new Date(),
      ...(winner && winner.id ? { gatewayPaymentId: winner.id } : {}),
    };

    // Nothing captured and nothing authorised: the customer genuinely did not
    // pay. Leave our record as it is — 'initiated' is the correct state.
    if (capturedPaise === 0 && authorized.length === 0) {
      await Payment.findByIdAndUpdate(payment._id, { $set: base });
      return { changed: false, status: payment.status, gatewayStatus: base.gatewayStatus };
    }

    // Money is held but not taken. Our intents auto-capture, so this is unusual
    // enough to surface rather than quietly treat as paid.
    if (capturedPaise === 0 && authorized.length > 0) {
      await Payment.findByIdAndUpdate(payment._id, { $set: { ...base, status: 'authorized' } });
      await flagMismatch(
        payment._id,
        MISMATCH.AUTHORIZED_NOT_CAPTURED,
        `Razorpay is holding ${authorized.length} authorized payment(s) that were never captured.`
      );
      return { changed: true, status: 'authorized', gatewayStatus: base.gatewayStatus };
    }

    // Captured, but for less than we asked for. Do NOT call this paid — but do
    // not silently drop it either, which is what used to happen: the payment
    // stayed 'initiated', the order got swept, and the customer's money stayed
    // at Razorpay with nobody aware of it.
    if (capturedPaise < payment.amountPaise) {
      await Payment.findByIdAndUpdate(payment._id, { $set: base });
      await flagMismatch(
        payment._id,
        MISMATCH.SHORT_CAPTURE,
        `Razorpay captured ${capturedPaise} paise against ${payment.amountPaise} owed.`
      );
      return {
        changed: true,
        status: payment.status,
        gatewayStatus: base.gatewayStatus,
        mismatch: MISMATCH.SHORT_CAPTURE,
      };
    }

    // Fully captured. Mark it so, then let the order catch up.
    const wasCaptured = payment.status === 'captured';
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        ...base,
        status: refundedPaise > 0 && refundedPaise >= capturedPaise ? 'refunded' : 'captured',
      },
    });
    if (!wasCaptured) {
      logger.info('Reconciliation: payment found captured at gateway', {
        paymentId: String(payment._id),
        gatewayPaymentId: winner && winner.id,
        capturedPaise,
      });
    }

    await this.syncOrderForPayment(payment, { capturedPaise, actorUserId });
    return {
      changed: !wasCaptured,
      status: 'captured',
      gatewayStatus: base.gatewayStatus,
      capturedPaise,
    };
  },

  /**
   * Bring the order into line with a payment now known to be captured.
   *
   * An order still awaiting payment is activated exactly as if the customer's
   * callback had arrived. An order that was already cancelled (by the sweeper,
   * most likely) cannot be un-cancelled safely — stock has gone back and the
   * customer has been told — so it is flagged for a human to refund or
   * reinstate deliberately.
   */
  async syncOrderForPayment(payment, { capturedPaise, actorUserId = null } = {}) {
    const order = await Order.findById(payment.orderId).lean();
    if (!order) return null;

    if (order.orderStatus === 'cancelled') {
      const reason = (order.cancellation && order.cancellation.reason) || 'no reason recorded';
      await flagMismatch(
        payment._id,
        MISMATCH.CAPTURED_ON_CANCELLED_ORDER,
        `Order ${order.orderNumber} was cancelled ("${reason}") but Razorpay captured ` +
          `${capturedPaise} paise. This money has not been returned.`
      );
      logger.warn('Reconciliation: captured payment on a cancelled order', {
        orderNumber: order.orderNumber,
        capturedPaise,
      });
      return order;
    }

    if (order.orderStatus === 'pending_payment') {
      const orderService = require('./order.service');
      try {
        return await orderService.activateOrder(order._id);
      } catch (error) {
        logger.error('Reconciliation: activation failed', {
          orderNumber: order.orderNumber,
          error: error.message,
        });
        return order;
      }
    }

    // Already a live order, but its paymentStatus never caught up — the exact
    // state 25 production orders were found in, eleven of them already delivered.
    if (order.paymentStatus !== 'paid') {
      const owed = Math.max(0, (order.totalPaise || 0) - (order.walletAmountPaise || 0));
      if (capturedPaise >= owed) {
        const updated = await Order.findByIdAndUpdate(
          order._id,
          {
            $set: { paymentStatus: 'paid' },
            $push: {
              statusHistory: {
                status: order.orderStatus,
                at: new Date(),
                note: 'Payment confirmed by gateway reconciliation',
                byUserId: actorUserId || undefined,
              },
            },
          },
          { new: true }
        ).lean();

        // Settlement is gated on the order being paid, so an order delivered
        // while its payment was still unconfirmed was skipped at delivery time
        // and would otherwise never pay its vendor or school at all. Now that
        // the money is confirmed, settle it — recordOrderSettlement is
        // idempotent per vendor, so this cannot double-credit.
        if (updated && updated.orderStatus === 'delivered') {
          const settlementService = require('../../vendor/services/settlement.service');
          for (const vendorId of updated.vendorIds || []) {
            try {
              await settlementService.recordOrderSettlement(vendorId, updated._id);
            } catch (settleError) {
              logger.error('Reconciliation: deferred settlement failed', {
                orderNumber: updated.orderNumber,
                vendorId: String(vendorId),
                error: settleError.message,
              });
            }
          }
        }
        return updated;
      }
    }
    return order;
  },

  /**
   * Refresh the status of every refund we have asked the gateway for.
   *
   * Refunds were previously written as done the moment the API call returned,
   * so a refund Razorpay later failed still showed as complete here forever.
   */
  async syncRefunds(paymentOrId) {
    const payment =
      typeof paymentOrId === 'object' && paymentOrId && paymentOrId._id
        ? paymentOrId
        : await Payment.findById(paymentOrId).lean();
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (payment.gateway !== 'razorpay' || !payment.gatewayPaymentId) {
      return { changed: false, reason: 'NOT_A_GATEWAY_PAYMENT' };
    }
    if (!paymentGateway.isRazorpayEnabled()) {
      return { changed: false, reason: 'GATEWAY_NOT_CONFIGURED' };
    }

    let gatewayRefunds = [];
    try {
      gatewayRefunds = await paymentGateway.fetchRefundsForPayment(
        payment.gatewayPaymentId,
        'razorpay'
      );
    } catch (error) {
      logger.error('Reconciliation: refund fetch failed', {
        paymentId: String(payment._id),
        error: error.message,
      });
      return { changed: false, error: error.message };
    }

    let changed = false;
    let refundedPaise = 0;
    for (const gr of gatewayRefunds) {
      refundedPaise += Number(gr.amount) || 0;
      const mapped =
        gr.status === 'processed' ? 'processed' : gr.status === 'failed' ? 'failed' : 'pending';
      const existing = (payment.refunds || []).find((r) => r.refundId === gr.id);

      if (!existing) {
        // A refund issued directly in the Razorpay dashboard, which we would
        // otherwise never know about.
        await Payment.findByIdAndUpdate(payment._id, {
          $push: {
            refunds: {
              refundId: gr.id,
              amountPaise: Number(gr.amount) || 0,
              at: gr.created_at ? new Date(gr.created_at * 1000) : new Date(),
              reason: (gr.notes && gr.notes.reason) || 'Refunded at gateway',
              status: mapped,
              settledAt: mapped === 'processed' ? new Date() : undefined,
              source: 'sync',
            },
          },
        });
        changed = true;
        continue;
      }

      if (existing.status !== mapped) {
        await Payment.findOneAndUpdate(
          { _id: payment._id, 'refunds.refundId': gr.id },
          {
            $set: {
              'refunds.$.status': mapped,
              ...(mapped === 'processed' ? { 'refunds.$.settledAt': new Date() } : {}),
              ...(mapped === 'failed'
                ? {
                    'refunds.$.failureReason':
                      gr.error_description || 'Refund failed at the gateway',
                  }
                : {}),
            },
          }
        );
        changed = true;
        if (mapped === 'failed') {
          await flagMismatch(
            payment._id,
            MISMATCH.REFUND_FAILED,
            `Refund ${gr.id} failed at the gateway; the customer has not been paid back.`
          );
        }
      }
    }

    if (changed) {
      await Payment.findByIdAndUpdate(payment._id, {
        $set: { amountRefundedPaise: refundedPaise, lastSyncedAt: new Date() },
      });
    }
    return { changed, refundedPaise, count: gatewayRefunds.length };
  },

  /** Reconcile one order end to end — every payment it has, plus their refunds. */
  async syncOrder(orderId, { actorUserId = null } = {}) {
    const payments = await Payment.find({ orderId }).lean();
    const results = [];
    for (const payment of payments) {
      const result = await this.syncPayment(payment, { actorUserId });
      if (payment.gatewayPaymentId || result.status === 'captured') {
        result.refunds = await this.syncRefunds(payment._id);
      }
      results.push({ paymentId: String(payment._id), ...result });
    }
    const order = await Order.findById(orderId).lean();
    return { order, payments: results };
  },

  /**
   * Background sweep: re-check unresolved payments against the gateway.
   *
   * Targets payments that claim to be unfinished and have not been checked
   * recently — the population that, in production, silently held 80 rows and
   * about ₹45,000 of unknown-state money.
   */
  async sweep({ limit = 50, staleMinutes = 10 } = {}) {
    if (!paymentGateway.isRazorpayEnabled()) {
      return { checked: 0, recovered: 0, mismatched: 0, reason: 'GATEWAY_NOT_CONFIGURED' };
    }
    const staleBefore = new Date(Date.now() - staleMinutes * 60 * 1000);
    const candidates = await Payment.find({
      gateway: 'razorpay',
      status: { $in: ['initiated', 'authorized'] },
      $or: [{ lastSyncedAt: null }, { lastSyncedAt: { $lte: staleBefore } }],
    })
      .sort({ lastSyncedAt: 1, 'audit.createdAt': 1 })
      .limit(limit)
      .lean();

    let recovered = 0;
    let mismatched = 0;
    for (const payment of candidates) {
      try {
        const result = await this.syncPayment(payment);
        if (result.changed && result.status === 'captured') recovered += 1;
        if (result.mismatch) mismatched += 1;
      } catch (error) {
        logger.error('Reconciliation sweep: payment failed', {
          paymentId: String(payment._id),
          error: error.message,
        });
      }
    }
    return { checked: candidates.length, recovered, mismatched };
  },

  /** Payments whose gateway view and ours disagree — the admin mismatch queue. */
  async listMismatches({ limit = 100 } = {}) {
    return Payment.find({ 'reconciliation.status': 'mismatch' })
      .sort({ 'reconciliation.detectedAt': -1 })
      .limit(limit)
      .populate('orderId', 'orderNumber orderStatus paymentStatus totalPaise')
      .lean();
  },

  /** Mark a mismatch dealt with, with a note saying how. */
  async resolveMismatch(paymentId, { note, actorUserId }) {
    const updated = await Payment.findByIdAndUpdate(
      paymentId,
      {
        $set: {
          'reconciliation.status': 'resolved',
          'reconciliation.resolvedAt': new Date(),
          'reconciliation.resolvedBy': actorUserId,
          'reconciliation.resolutionNote': note,
        },
      },
      { new: true }
    ).lean();
    if (!updated) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    return updated;
  },
};

module.exports = reconciliationService;
