const { randomHex } = require('../../utils/crypto');

/**
 * Internal payment gateway stub — used for COD and when Razorpay is not configured.
 */
const internalGateway = {
  async createPaymentIntent({ orderId, amountPaise, method, currency = 'INR' }) {
    return {
      gateway: 'internal',
      // Suffixed with a random token, not just orderId: an order can have more
      // than one Payment over its lifetime (e.g. an RFQ order's advance, then
      // its remainder) — a purely orderId-derived id would collide on the
      // unique gatewayPaymentId index the moment a second payment is captured.
      gatewayOrderId: `INT-ORD-${orderId}-${randomHex(4)}`,
      amountPaise,
      currency,
      method,
      status: 'initiated',
    };
  },

  async capturePayment({ gatewayOrderId }) {
    return {
      gatewayPaymentId: `INT-PAY-${gatewayOrderId}`,
      status: 'captured',
    };
  },

  async initiateRefund({ gatewayPaymentId, amountPaise, reason }) {
    return {
      refundId: `INT-REF-${gatewayPaymentId}-${Date.now()}`,
      amountPaise,
      reason,
      status: 'initiated',
    };
  },
};

module.exports = internalGateway;
