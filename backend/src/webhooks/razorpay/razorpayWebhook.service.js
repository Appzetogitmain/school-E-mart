const crypto = require('crypto');
const WebhookEvent = require('../../database/models/WebhookEvent');
const Payment = require('../../database/models/Payment');
const Order = require('../../database/models/Order');
const paymentGateway = require('../../services/paymentGateway');
const logger = require('../../common/logger');
const { triggerService } = require('../../services/notification');

const DUPLICATE_KEY_CODE = 11000;

const resolveEventId = (headers, payload) => {
  const headerId = headers['x-razorpay-event-id'];
  if (headerId) return String(headerId);
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
};

/**
 * Find our Payment row for a gateway entity.
 *
 * Razorpay's payment entity carries both its own id and the order id we created,
 * and an order can legitimately have more than one Payment (an RFQ advance and
 * its remainder). Matching on the gateway payment id first, then falling back to
 * the order id, picks the right row instead of whichever one findOne happened to
 * return.
 */
const findPaymentForEntity = async (entity) => {
  if (entity.id) {
    const byPaymentId = await Payment.findOne({ gatewayPaymentId: entity.id });
    if (byPaymentId) return byPaymentId;
  }
  if (!entity.order_id) return null;
  // Prefer a row still expecting money over one already settled, so a second
  // event for an RFQ order does not re-open the payment that is already done.
  const candidates = await Payment.find({ gatewayOrderId: entity.order_id }).sort({
    'audit.createdAt': 1,
  });
  if (candidates.length <= 1) return candidates[0] || null;
  return (
    candidates.find((p) => ['initiated', 'authorized'].includes(p.status)) || candidates[0]
  );
};

const flagMismatch = (paymentId, code, detail) =>
  Payment.findByIdAndUpdate(paymentId, {
    $set: {
      'reconciliation.status': 'mismatch',
      'reconciliation.code': code,
      'reconciliation.detail': detail,
      'reconciliation.detectedAt': new Date(),
    },
  });

const markPaymentCaptured = async (paymentEntity) => {
  const payment = await findPaymentForEntity(paymentEntity);
  if (!payment) {
    logger.warn('Webhook payment.captured: payment not found', {
      orderId: paymentEntity.order_id,
      paymentId: paymentEntity.id,
    });
    return;
  }

  const capturedPaise = Number(paymentEntity.amount);

  if (payment.status === 'captured') {
    // Already recorded. Still refresh what the gateway says, so the admin panel
    // and the Razorpay dashboard stay comparable.
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        gatewayStatus: paymentEntity.status || 'captured',
        amountCapturedPaise: capturedPaise,
        amountRefundedPaise: Number(paymentEntity.amount_refunded) || 0,
        lastSyncedAt: new Date(),
      },
    });
    return;
  }

  // Razorpay reports what was actually collected. Taking the event as proof of
  // payment without comparing it to what was owed meant a short capture — a
  // partial payment, or an intent whose amount was altered — still marked the
  // order fully paid.
  if (!Number.isFinite(capturedPaise) || capturedPaise < payment.amountPaise) {
    logger.warn('Webhook payment.captured: captured amount is short of the amount owed', {
      gatewayOrderId: paymentEntity.order_id,
      capturedPaise,
      expectedPaise: payment.amountPaise,
    });
    // Recording the shortfall rather than returning silently. Dropping the event
    // left the order looking unpaid while Razorpay held the customer's money,
    // and the sweeper then cancelled the order — money gone, order gone, nobody
    // told. A flagged mismatch puts it in front of an operator instead.
    await Payment.findByIdAndUpdate(payment._id, {
      $set: {
        gatewayStatus: paymentEntity.status || 'captured',
        gatewayPaymentId: paymentEntity.id,
        amountCapturedPaise: Number.isFinite(capturedPaise) ? capturedPaise : 0,
        lastSyncedAt: new Date(),
      },
    });
    await flagMismatch(
      payment._id,
      'SHORT_CAPTURE',
      `Razorpay captured ${capturedPaise} paise against ${payment.amountPaise} owed.`
    );
    return;
  }

  await Payment.findByIdAndUpdate(payment._id, {
    $set: {
      status: 'captured',
      gatewayPaymentId: paymentEntity.id,
      gatewayStatus: paymentEntity.status || 'captured',
      amountCapturedPaise: capturedPaise,
      amountRefundedPaise: Number(paymentEntity.amount_refunded) || 0,
      lastSyncedAt: new Date(),
      'reconciliation.status': 'ok',
    },
  });

  const order = await Order.findById(payment.orderId).lean();

  // Money arrived for an order we already cancelled — almost always the sweeper
  // having given up before the customer finished paying. It cannot be silently
  // activated (stock went back, the customer was told it was cancelled), so it
  // is flagged for a refund-or-reinstate decision.
  if (order && order.orderStatus === 'cancelled') {
    await flagMismatch(
      payment._id,
      'CAPTURED_ON_CANCELLED_ORDER',
      `Order ${order.orderNumber} was cancelled but Razorpay captured ${capturedPaise} paise.`
    );
    logger.warn('Webhook payment.captured: order was already cancelled', {
      orderNumber: order.orderNumber,
      capturedPaise,
    });
    return;
  }

  await Order.findByIdAndUpdate(payment.orderId, { $set: { paymentStatus: 'paid' } });

  // The webhook is the authoritative confirmation — it arrives even when the
  // customer closes the tab before the client-side callback runs. Without this,
  // an order that was genuinely paid for stayed stuck awaiting payment and was
  // eventually swept away. activateOrder re-checks the captured total and is
  // safe to reach twice, so the client callback and this racing is fine.
  const orderService = require('../../modules/orders/services/order.service');
  try {
    await orderService.activateOrder(payment.orderId);
  } catch (activationError) {
    logger.warn('Webhook payment.captured: order activation failed', {
      orderId: String(payment.orderId),
      error: activationError.message,
    });
  }

  const hydrated = await Order.findById(payment.orderId).lean();
  if (hydrated) {
    triggerService.notifyPaymentSuccess(hydrated);
  }
};

/**
 * Razorpay has the customer's money but has not taken it yet. Our intents ask
 * for auto-capture, so this normally resolves into payment.captured moments
 * later; recording it means an authorisation that never captures is visible
 * rather than indistinguishable from "never paid".
 */
const markPaymentAuthorized = async (paymentEntity) => {
  const payment = await findPaymentForEntity(paymentEntity);
  if (!payment || payment.status === 'captured') return;

  await Payment.findByIdAndUpdate(payment._id, {
    $set: {
      status: 'authorized',
      gatewayPaymentId: paymentEntity.id,
      gatewayStatus: paymentEntity.status || 'authorized',
      lastSyncedAt: new Date(),
    },
  });
  await Order.findByIdAndUpdate(payment.orderId, { $set: { paymentStatus: 'authorized' } });
};

const markPaymentFailed = async (paymentEntity) => {
  const payment = await findPaymentForEntity(paymentEntity);
  // A capture already recorded outranks a failure event: Razorpay sends
  // payment.failed for each failed attempt, and a customer who fails once and
  // then succeeds must not have the successful order marked failed.
  if (!payment || payment.status === 'captured') return;

  await Payment.findByIdAndUpdate(payment._id, {
    $set: {
      status: 'failed',
      gatewayStatus: paymentEntity.status || 'failed',
      lastSyncedAt: new Date(),
      failureReason:
        paymentEntity.error_description || paymentEntity.error_reason || 'Payment failed',
    },
  });

  const order = await Order.findById(payment.orderId).lean();
  if (order) {
    triggerService.notifyPaymentFailed(
      order,
      paymentEntity.error_description || paymentEntity.error_reason
    );
  }
};

/**
 * Record or update one refund from a gateway event.
 *
 * `refund.created` means Razorpay has accepted the request, NOT that the money
 * has reached the customer — only `refund.processed` means that. Writing
 * 'completed' on creation is why every refund in production read as done while
 * the gateway still had them pending.
 *
 * Also de-duplicates: a refund we initiated ourselves is already in the array,
 * and the matching webhook used to push a second copy of it, double-counting
 * the amount refunded.
 */
const upsertRefund = async (refundEntity, mappedStatus) => {
  const payment = await Payment.findOne({ gatewayPaymentId: refundEntity.payment_id });
  if (!payment) {
    logger.warn('Webhook refund event: payment not found', {
      paymentId: refundEntity.payment_id,
      refundId: refundEntity.id,
    });
    return;
  }

  const refundAmount = Number(refundEntity.amount) || 0;
  const existing = (payment.refunds || []).find((r) => r.refundId === refundEntity.id);

  if (existing) {
    await Payment.findOneAndUpdate(
      { _id: payment._id, 'refunds.refundId': refundEntity.id },
      {
        $set: {
          'refunds.$.status': mappedStatus,
          ...(mappedStatus === 'processed' ? { 'refunds.$.settledAt': new Date() } : {}),
          ...(mappedStatus === 'failed'
            ? {
                'refunds.$.failureReason':
                  refundEntity.error_description || 'Refund failed at the gateway',
              }
            : {}),
        },
      }
    );
  } else {
    await Payment.findByIdAndUpdate(payment._id, {
      $push: {
        refunds: {
          refundId: refundEntity.id,
          amountPaise: refundAmount,
          at: refundEntity.created_at ? new Date(refundEntity.created_at * 1000) : new Date(),
          reason: (refundEntity.notes && refundEntity.notes.reason) || 'Refunded at gateway',
          status: mappedStatus,
          settledAt: mappedStatus === 'processed' ? new Date() : undefined,
          source: 'webhook',
        },
      },
    });
  }

  // Recompute the settled total from the array rather than accumulating, so a
  // replayed or duplicated event cannot inflate it.
  const fresh = await Payment.findById(payment._id).lean();
  const settledPaise = (fresh.refunds || [])
    .filter((r) => r.status === 'processed')
    .reduce((sum, r) => sum + (r.amountPaise || 0), 0);

  const paymentStatus =
    settledPaise <= 0
      ? fresh.status === 'refunded' || fresh.status === 'partially_refunded'
        ? 'captured'
        : fresh.status
      : settledPaise >= (fresh.amountPaise || 0)
        ? 'refunded'
        : 'partially_refunded';

  await Payment.findByIdAndUpdate(payment._id, {
    $set: { status: paymentStatus, amountRefundedPaise: settledPaise, lastSyncedAt: new Date() },
  });

  // The order's payment status only claims "refunded" once money has actually
  // settled back to the customer.
  const order = await Order.findById(payment.orderId).lean();
  if (order) {
    const owed = Math.max(0, (order.totalPaise || 0) - (order.walletAmountPaise || 0));
    const orderPaymentStatus =
      settledPaise <= 0 ? order.paymentStatus : settledPaise >= owed ? 'refunded' : 'partially_refunded';
    if (orderPaymentStatus !== order.paymentStatus) {
      await Order.findByIdAndUpdate(order._id, { $set: { paymentStatus: orderPaymentStatus } });
    }
  }

  if (mappedStatus === 'failed') {
    await flagMismatch(
      payment._id,
      'REFUND_FAILED',
      `Refund ${refundEntity.id} failed at the gateway; the customer has not been paid back.`
    );
  }
};

const dispatchEvent = async (eventType, payload) => {
  const paymentEntity = payload.payload && payload.payload.payment && payload.payload.payment.entity;
  const refundEntity = payload.payload && payload.payload.refund && payload.payload.refund.entity;

  switch (eventType) {
    case 'payment.captured':
      if (paymentEntity) await markPaymentCaptured(paymentEntity);
      break;
    case 'payment.authorized':
      if (paymentEntity) await markPaymentAuthorized(paymentEntity);
      break;
    case 'payment.failed':
      if (paymentEntity) await markPaymentFailed(paymentEntity);
      break;
    // order.paid carries the payment entity too and is the event Razorpay sends
    // once an order is fully paid. Treating it as a capture closes the gap where
    // payment.captured is missed or arrives out of order.
    case 'order.paid':
      if (paymentEntity) await markPaymentCaptured(paymentEntity);
      break;
    case 'refund.created':
      if (refundEntity) await upsertRefund(refundEntity, 'pending');
      break;
    case 'refund.processed':
      if (refundEntity) await upsertRefund(refundEntity, 'processed');
      break;
    case 'refund.failed':
      if (refundEntity) await upsertRefund(refundEntity, 'failed');
      break;
    case 'refund.speed_changed':
      if (refundEntity) {
        await upsertRefund(refundEntity, refundEntity.status === 'processed' ? 'processed' : 'pending');
      }
      break;
    default:
      logger.info('Razorpay webhook: unhandled event type', { eventType });
      break;
  }
};

const processRazorpayWebhook = async (rawBody, headers) => {
  const signature = headers['x-razorpay-signature'];
  if (!paymentGateway.verifyWebhookSignature(rawBody, signature)) {
    const error = new Error('Invalid webhook signature');
    error.statusCode = 401;
    throw error;
  }

  const payload = JSON.parse(rawBody.toString('utf8'));
  const eventId = resolveEventId(headers, payload);
  const eventType = payload.event;

  let webhookEvent;
  try {
    [webhookEvent] = await WebhookEvent.create([
      {
        provider: 'razorpay',
        eventId,
        eventType,
        status: 'processing',
        payload,
      },
    ]);
  } catch (error) {
    if (error.code === DUPLICATE_KEY_CODE) {
      return { duplicate: true };
    }
    throw error;
  }

  try {
    await dispatchEvent(eventType, payload);
    await WebhookEvent.findByIdAndUpdate(webhookEvent._id, { $set: { status: 'processed' } });
    return { duplicate: false };
  } catch (error) {
    logger.error('Razorpay webhook processing failed', {
      eventId,
      eventType,
      error: error.message,
    });
    await WebhookEvent.findByIdAndUpdate(webhookEvent._id, {
      $set: { status: 'failed', error: error.message },
    });
    throw error;
  }
};

module.exports = { processRazorpayWebhook };
