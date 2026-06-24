const internalGateway = require('./internal');
const razorpayGateway = require('./razorpay');
const { isRazorpayConfigured } = require('./razorpayClient');

const useRazorpayForOnline = (method) =>
  method !== 'cod' && process.env.NODE_ENV !== 'test' && isRazorpayConfigured();

const paymentGateway = {
  isRazorpayEnabled: isRazorpayConfigured,

  verifyPaymentSignature(params) {
    return razorpayGateway.verifyPaymentSignature(params);
  },

  verifyWebhookSignature(rawBody, signature) {
    return razorpayGateway.verifyWebhookSignature(rawBody, signature);
  },

  async createPaymentIntent({ orderId, amountPaise, method, currency = 'INR' }) {
    if (useRazorpayForOnline(method)) {
      return razorpayGateway.createPaymentIntent({ orderId, amountPaise, currency });
    }
    return internalGateway.createPaymentIntent({ orderId, amountPaise, method, currency });
  },

  async capturePayment({ gatewayOrderId, gateway }) {
    if (gateway === 'razorpay') {
      return razorpayGateway.capturePayment({ gatewayOrderId });
    }
    return internalGateway.capturePayment({ gatewayOrderId });
  },

  async initiateRefund({ gatewayPaymentId, amountPaise, reason, gateway }) {
    if (gateway === 'razorpay' && isRazorpayConfigured()) {
      return razorpayGateway.initiateRefund({ gatewayPaymentId, amountPaise, reason });
    }
    return internalGateway.initiateRefund({ gatewayPaymentId, amountPaise, reason });
  },
};

module.exports = paymentGateway;
