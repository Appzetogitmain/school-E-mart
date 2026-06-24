/**
 * Internal payment gateway stub — used for COD and when Razorpay is not configured.
 */
const internalGateway = {
  async createPaymentIntent({ orderId, amountPaise, method, currency = 'INR' }) {
    return {
      gateway: 'internal',
      gatewayOrderId: `INT-ORD-${orderId}`,
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
