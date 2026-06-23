/**
 * Payment gateway interface stub — no external gateway integration in this phase.
 * Actual gateway adapters will plug in here later.
 */
const paymentGateway = {
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

module.exports = paymentGateway;
