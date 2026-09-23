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

  /**
   * There is no gateway holding this money — a COD refund is settled by hand
   * (cash back, or a wallet credit), so the only honest thing to report is
   * that a refund is owed, not that one has been paid out. Reporting
   * 'processed' here is what let a cancelled COD order claim its money had
   * been returned when nothing had moved.
   */
  async initiateRefund({ gatewayPaymentId, amountPaise, reason }) {
    return {
      refundId: `INT-REF-${gatewayPaymentId}-${Date.now()}`,
      amountPaise,
      reason,
      status: 'pending',
      manual: true,
    };
  },

  // Read side — the stub has no external truth to offer, so it reports nothing
  // and the reconciler leaves internal payments alone.
  async fetchPaymentsForOrder() {
    return [];
  },
  async fetchOrder() {
    return null;
  },
  async fetchPayment() {
    return null;
  },
  async fetchRefundsForPayment() {
    return [];
  },
};

module.exports = internalGateway;
