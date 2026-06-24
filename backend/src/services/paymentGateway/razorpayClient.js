const Razorpay = require('razorpay');
const config = require('../../config/env');

let instance = null;

const getRazorpayInstance = () => {
  if (!config.RAZORPAY_KEY_ID || !config.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay credentials are not configured');
  }
  if (!instance) {
    instance = new Razorpay({
      key_id: config.RAZORPAY_KEY_ID,
      key_secret: config.RAZORPAY_KEY_SECRET,
    });
  }
  return instance;
};

const isRazorpayConfigured = () =>
  Boolean(config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET);

module.exports = { getRazorpayInstance, isRazorpayConfigured };
