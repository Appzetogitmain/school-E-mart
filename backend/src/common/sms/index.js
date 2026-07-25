const logger = require('../logger');
const env = require('../../config/env');
const { ServiceUnavailableError } = require('../errors');
const smsIndiaHub = require('./smsIndiaHub.provider');

const maskPhone = (phone) => `${String(phone).slice(0, 2)}******${String(phone).slice(-2)}`;

/**
 * The DLT-approved template, whose two ##var## slots are, in order, the sender
 * entity and the OTP:
 *   "Welcome to the ##var## powered by SMSINDIAHUB. Your OTP for registration is ##var##"
 * The wording must match the registered template exactly or the operator drops
 * the message, so it is substituted positionally rather than rebuilt.
 */
const renderOtpTemplate = (otp) =>
  env.SMS_OTP_TEMPLATE
    .replace('##var##', env.SMS_ENTITY_NAME)
    .replace('##var##', String(otp));

const providers = { smsindiahub: smsIndiaHub };

const smsService = {
  renderOtpTemplate,

  async sendOtp({ phone, otp, purpose }) {
    const message = renderOtpTemplate(otp);
    const provider = providers[env.SMS_PROVIDER];

    if (!provider) {
      throw new Error(`Unknown SMS_PROVIDER "${env.SMS_PROVIDER}"`);
    }

    if (!env.SMSINDIAHUB_API_KEY || !env.SMSINDIAHUB_SENDER_ID) {
      logger.warn(`[SMS] SMS Gateway credentials missing in .env. Generated OTP for ${phone}: ${otp}`);
      return { success: true, delivered: false, mock: true };
    }

    try {
      const result = await provider.send({ phone, message });
      logger.info('OTP SMS sent', {
        phone: maskPhone(phone),
        purpose,
        provider: result.provider,
        jobId: result.jobId,
      });
      return { success: true, delivered: true, ...result };
    } catch (error) {
      logger.error('OTP SMS gateway dispatch failed', {
        phone: maskPhone(phone),
        purpose,
        provider: env.SMS_PROVIDER,
        reason: error.message,
        otpCode: otp,
      });
      // Log fallback OTP to server console so login can proceed even if SMS gateway is failing
      logger.warn(`🔑 [OTP FALLBACK] SMS dispatch failed (${error.message}). Use OTP: ${otp} for phone: ${phone}`);
      return { success: true, delivered: false, error: error.message };
    }
  },
};

module.exports = smsService;
