const crypto = require('crypto');
const config = require('../../config/env');
const { getRazorpayInstance } = require('./razorpayClient');

const verifyPaymentSignature = ({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false;
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expected = crypto.createHmac('sha256', config.RAZORPAY_KEY_SECRET).update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpaySignature));
  } catch {
    return false;
  }
};

const verifyWebhookSignature = (rawBody, signature) => {
  if (!config.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto
    .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
};

const razorpayGateway = {
  verifyPaymentSignature,
  verifyWebhookSignature,

  /**
   * `notes` carry our own identifiers into the Razorpay dashboard.
   *
   * Without them a dashboard row showed only an opaque receipt (a Mongo id), so
   * nobody could match a Razorpay payment to an order by eye — which is exactly
   * how a mismatch goes unnoticed until a customer complains. orderNumber is the
   * same string the admin panel and the customer's invoice show.
   */
  async createPaymentIntent({ orderId, amountPaise, currency = 'INR', orderNumber, userId }) {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: String(orderNumber || orderId),
      payment_capture: 1,
      notes: {
        orderNumber: String(orderNumber || ''),
        orderId: String(orderId),
        userId: String(userId || ''),
        source: 'school-e-mart',
      },
    });

    return {
      gateway: 'razorpay',
      gatewayOrderId: order.id,
      amountPaise,
      currency,
      status: 'initiated',
    };
  },

  async capturePayment() {
    throw new Error('Razorpay payments are confirmed via signature verification, not capture');
  },

  async initiateRefund({ gatewayPaymentId, amountPaise, reason, notes = {} }) {
    const razorpay = getRazorpayInstance();
    const refund = await razorpay.payments.refund(gatewayPaymentId, {
      amount: amountPaise,
      notes: { reason: reason || '', ...notes },
    });

    return {
      refundId: refund.id,
      amountPaise: Number(refund.amount) || amountPaise,
      reason,
      // Razorpay returns 'pending' or 'processed'. Never assume 'processed'.
      status: refund.status || 'pending',
      raw: refund,
    };
  },

  // ---------------------------------------------------------------------------
  // Read side. The gateway is the authority on what money actually moved, so
  // reconciliation needs to be able to ask it rather than infer from our own
  // records. None of this existed before, which is why an unanswered checkout
  // could only ever be guessed at.
  // ---------------------------------------------------------------------------

  /** Every payment attempt Razorpay has recorded against one of our orders. */
  async fetchPaymentsForOrder(gatewayOrderId) {
    const razorpay = getRazorpayInstance();
    const result = await razorpay.orders.fetchPayments(gatewayOrderId);
    return result?.items || [];
  },

  async fetchOrder(gatewayOrderId) {
    const razorpay = getRazorpayInstance();
    return razorpay.orders.fetch(gatewayOrderId);
  },

  async fetchPayment(gatewayPaymentId) {
    const razorpay = getRazorpayInstance();
    return razorpay.payments.fetch(gatewayPaymentId);
  },

  async fetchRefund(gatewayPaymentId, refundId) {
    const razorpay = getRazorpayInstance();
    return razorpay.payments.fetchRefund(gatewayPaymentId, refundId);
  },

  async fetchRefundsForPayment(gatewayPaymentId) {
    const razorpay = getRazorpayInstance();
    const result = await razorpay.payments.fetchMultipleRefund(gatewayPaymentId);
    return result?.items || [];
  },
};

module.exports = razorpayGateway;
