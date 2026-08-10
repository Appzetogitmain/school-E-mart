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
      logger.warn(`🔑 [SMS MOCK] Credentials unconfigured in .env. Generated OTP for ${phone}: ${otp}`);
      if (env.NODE_ENV === 'production') {
        throw new ServiceUnavailableError(
          'SMS gateway credentials are missing. Please contact system administrator.',
          'SMS_GATEWAY_CONFIG_MISSING'
        );
      }
      return { success: true, delivered: false, mock: true };
    }

    try {
      const result = await provider.send({ phone, message });
      logger.info('OTP SMS sent successfully', {
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

      // In development / test, log fallback OTP so login can proceed
      logger.warn(`🔑 [OTP FALLBACK] SMS dispatch failed (${error.message}). Use OTP: ${otp} for phone: ${phone}`);

      if (env.NODE_ENV === 'production') {
        throw new ServiceUnavailableError(
          'SMS gateway is currently unable to deliver your OTP. Please try again shortly.',
          'SMS_GATEWAY_DISPATCH_FAILED'
        );
      }

      return { success: true, delivered: false, error: error.message };
    }
  },
};

module.exports = smsService;
