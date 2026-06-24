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

  async createPaymentIntent({ orderId, amountPaise, currency = 'INR' }) {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt: String(orderId),
      payment_capture: 1,
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

  async initiateRefund({ gatewayPaymentId, amountPaise, reason }) {
    const razorpay = getRazorpayInstance();
    const refund = await razorpay.payments.refund(gatewayPaymentId, {
      amount: amountPaise,
      notes: { reason: reason || '' },
    });

    return {
      refundId: refund.id,
      amountPaise,
      reason,
      status: refund.status || 'initiated',
    };
  },
};

module.exports = razorpayGateway;
