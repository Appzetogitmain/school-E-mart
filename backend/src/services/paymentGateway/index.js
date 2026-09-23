const internalGateway = require('./internal');
const razorpayGateway = require('./razorpay');
const { isRazorpayConfigured } = require('./razorpayClient');

const useRazorpayForOnline = (method) =>
  method !== 'cod' && process.env.NODE_ENV !== 'test' && isRazorpayConfigured();

const adapterFor = (gateway) =>
  gateway === 'razorpay' && isRazorpayConfigured() ? razorpayGateway : internalGateway;

const paymentGateway = {
  isRazorpayEnabled: isRazorpayConfigured,
  adapterFor,

  verifyPaymentSignature(params) {
    return razorpayGateway.verifyPaymentSignature(params);
  },

  verifyWebhookSignature(rawBody, signature) {
    return razorpayGateway.verifyWebhookSignature(rawBody, signature);
  },

  async createPaymentIntent({ orderId, amountPaise, method, currency = 'INR', orderNumber, userId }) {
    if (useRazorpayForOnline(method)) {
      return razorpayGateway.createPaymentIntent({
        orderId,
        amountPaise,
        currency,
        orderNumber,
        userId,
      });
    }
    return internalGateway.createPaymentIntent({ orderId, amountPaise, method, currency });
  },

  async capturePayment({ gatewayOrderId, gateway }) {
    if (gateway === 'razorpay') {
      return razorpayGateway.capturePayment({ gatewayOrderId });
    }
    return internalGateway.capturePayment({ gatewayOrderId });
  },

  async initiateRefund({ gatewayPaymentId, amountPaise, reason, gateway, notes }) {
    if (gateway === 'razorpay' && isRazorpayConfigured()) {
      return razorpayGateway.initiateRefund({ gatewayPaymentId, amountPaise, reason, notes });
    }
    return internalGateway.initiateRefund({ gatewayPaymentId, amountPaise, reason });
  },

  // Read side, routed by the gateway that actually holds the money.
  fetchPaymentsForOrder(gatewayOrderId, gateway) {
    return adapterFor(gateway).fetchPaymentsForOrder(gatewayOrderId);
  },
  fetchOrder(gatewayOrderId, gateway) {
    return adapterFor(gateway).fetchOrder(gatewayOrderId);
  },
  fetchPayment(gatewayPaymentId, gateway) {
    return adapterFor(gateway).fetchPayment(gatewayPaymentId);
  },
  fetchRefundsForPayment(gatewayPaymentId, gateway) {
    return adapterFor(gateway).fetchRefundsForPayment(gatewayPaymentId);
  },
};

module.exports = paymentGateway;
