const logger = require('../logger');

const smsService = {
  async sendOtp({ phone, otp, purpose }) {
    logger.info('SMS OTP dispatched', {
      phone: `${phone.slice(0, 2)}******${phone.slice(-2)}`,
      purpose,
      otp: process.env.NODE_ENV === 'production' ? '[redacted]' : otp,
    });

    return { success: true, provider: 'stub' };
  },
};

module.exports = smsService;
