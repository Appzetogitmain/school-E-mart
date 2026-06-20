const logger = require('../logger');
const env = require('../../config/env');

const emailService = {
  async sendPasswordResetEmail({ to, name, resetUrl, token }) {
    logger.info('Password reset email dispatched', {
      to,
      name,
      resetUrl,
      token: env.NODE_ENV === 'production' ? '[redacted]' : token,
    });

    return { success: true, provider: 'stub' };
  },

  async sendEmailVerification({ to, name, verifyUrl, token }) {
    logger.info('Email verification dispatched', {
      to,
      name,
      verifyUrl,
      token: env.NODE_ENV === 'production' ? '[redacted]' : token,
    });

    return { success: true, provider: 'stub' };
  },
};

module.exports = emailService;
