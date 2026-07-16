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

    // No credentials means no OTP can reach anyone. Fail loudly rather than
    // resolving, or callers would report a login code that was never sent.
    if (!env.SMSINDIAHUB_API_KEY || !env.SMSINDIAHUB_SENDER_ID) {
      throw new Error(
        'SMS not sent: SMSINDIAHUB_API_KEY and SMSINDIAHUB_SENDER_ID must be configured'
      );
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
      // The gateway's own wording ("senderid not valid", "Invalid Login") names
      // our account misconfiguration and must stay in the logs for whoever is
      // debugging it — but it means nothing to the parent waiting for a code,
      // so it never reaches the response body.
      logger.error('OTP SMS failed', {
        phone: maskPhone(phone),
        purpose,
        provider: env.SMS_PROVIDER,
        reason: error.message,
      });
      throw new ServiceUnavailableError(
        'Could not send the OTP right now. Please try again in a moment.',
        'OTP_SMS_FAILED'
      );
    }
  },
};

module.exports = smsService;
