const mongoose = require('mongoose');
const env = require('../../../config/env');
const {
  UnauthorizedError,
  TooManyRequestsError,
  NotFoundError,
} = require('../../../common/errors');
const { generateOtp, hashOtp, normalizePhone } = require('../../../utils');
const { messages, roles } = require('../../../constants');
const smsService = require('../../../common/sms');
const otpRepository = require('../repositories/otp.repository');
const userRepository = require('../repositories/user.repository');
const auditRepository = require('../repositories/audit.repository');
const { issueAuthenticatedSession } = require('./sessionIssue.service');

const { ROLES } = roles;

const OTP_PURPOSE_CONFIG = {
  login_parent: { length: 4, requiresUser: true, role: ROLES.PARENT },
  signup_parent: { length: 4, requiresUser: false, role: ROLES.PARENT },
  web_register: { length: 6, requiresUser: false, role: ROLES.PARENT },
  password_reset: { length: 6, requiresUser: true, role: null },
};

const resendCooldowns = new Map();

const otpService = {
  async requestOtp({ phone, purpose }, requestMeta = {}) {
    const normalizedPhone = normalizePhone(phone);
    const config = OTP_PURPOSE_CONFIG[purpose];
    if (!config) {
      throw new UnauthorizedError(messages.AUTH.OTP_INVALID, 'INVALID_OTP_PURPOSE');
    }

    const cooldownKey = `${normalizedPhone}:${purpose}`;
    const lastSentAt = resendCooldowns.get(cooldownKey);
    if (lastSentAt && Date.now() - lastSentAt < env.OTP_RESEND_COOLDOWN_MS) {
      const waitSeconds = Math.ceil(
        (env.OTP_RESEND_COOLDOWN_MS - (Date.now() - lastSentAt)) / 1000
      );
      throw new TooManyRequestsError(
        `Please wait ${waitSeconds} seconds before requesting another OTP`,
        'OTP_RESEND_COOLDOWN'
      );
    }

    const windowStart = new Date(Date.now() - env.OTP_WINDOW_MS);
    const recentCount = await otpRepository.countRecentByPhone(normalizedPhone, windowStart);
    if (recentCount >= env.OTP_MAX_PER_WINDOW) {
      throw new TooManyRequestsError(
        'Too many OTP requests. Please try again later.',
        'OTP_RATE_LIMIT'
      );
    }

    if (config.requiresUser) {
      const user = config.role
        ? await userRepository.findByPhoneAndRole(normalizedPhone, config.role)
        : await userRepository.findByPhone(normalizedPhone);

      if (!user) {
        await auditRepository.log({
          action: 'auth.otp.request.skipped',
          entityType: 'OtpRequest',
          entityId: new mongoose.Types.ObjectId(),
          ipAddress: requestMeta.ipAddress,
          userAgent: requestMeta.userAgent,
          after: { phone: normalizedPhone, purpose, reason: 'user_not_found' },
        });
        resendCooldowns.set(cooldownKey, Date.now());
        return { sent: true, expiresIn: Math.floor(env.OTP_EXPIRY_MS / 1000) };
      }
    }

    await otpRepository.invalidateActiveForPhone(normalizedPhone, purpose);

    const otp = generateOtp(config.length);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MS);

    await otpRepository.create({
      phone: normalizedPhone,
      purpose,
      otpHash: hashOtp(otp, normalizedPhone, purpose),
      length: config.length,
      expiresAt,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    await smsService.sendOtp({ phone: normalizedPhone, otp, purpose });
    resendCooldowns.set(cooldownKey, Date.now());

    await auditRepository.log({
      action: 'auth.otp.requested',
      entityType: 'OtpRequest',
      entityId: new mongoose.Types.ObjectId(),
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      after: { phone: normalizedPhone, purpose },
    });

    return {
      sent: true,
      expiresIn: Math.floor(env.OTP_EXPIRY_MS / 1000),
    };
  },

  async verifyOtp({ phone, otp, purpose }, requestMeta = {}, { issueSession = false } = {}) {
    const normalizedPhone = normalizePhone(phone);
    const config = OTP_PURPOSE_CONFIG[purpose];
    if (!config) {
      throw new UnauthorizedError(messages.AUTH.OTP_INVALID, 'INVALID_OTP_PURPOSE');
    }

    const otpRecord = await otpRepository.findLatestActive(normalizedPhone, purpose);
    if (!otpRecord) {
      throw new UnauthorizedError(messages.AUTH.OTP_INVALID, 'OTP_NOT_FOUND');
    }

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      throw new TooManyRequestsError(messages.AUTH.OTP_MAX_ATTEMPTS, 'OTP_MAX_ATTEMPTS');
    }

    const expectedHash = hashOtp(String(otp), normalizedPhone, purpose);
    if (expectedHash !== otpRecord.otpHash) {
      await otpRepository.incrementAttempts(otpRecord._id);
      await auditRepository.log({
        action: 'auth.otp.verify.failed',
        entityType: 'OtpRequest',
        entityId: otpRecord._id,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        after: { phone: normalizedPhone, purpose },
      });
      throw new UnauthorizedError(messages.AUTH.OTP_INVALID, 'OTP_INVALID');
    }

    await otpRepository.markConsumed(otpRecord._id);

    await auditRepository.log({
      action: 'auth.otp.verified',
      entityType: 'OtpRequest',
      entityId: otpRecord._id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      after: { phone: normalizedPhone, purpose },
    });

    if (!issueSession) {
      return { verified: true, phone: normalizedPhone };
    }

    const user = await userRepository.findByPhoneAndRole(normalizedPhone, ROLES.PARENT);
    if (!user) {
      throw new NotFoundError('Parent account not found. Please complete signup first.', 'PARENT_NOT_FOUND');
    }

    await userRepository.markPhoneVerified(user._id);

    return issueAuthenticatedSession(user, requestMeta, 'auth.login.otp.success');
  },

  async loginParentWithOtp(payload, requestMeta) {
    return this.verifyOtp(
      { ...payload, purpose: payload.purpose || 'login_parent' },
      requestMeta,
      { issueSession: true }
    );
  },
};

module.exports = otpService;
