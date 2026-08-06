const mongoose = require('mongoose');
const logger = require('../../../common/logger');
const env = require('../../../config/env');
const {
  UnauthorizedError,
  TooManyRequestsError,
  NotFoundError,
} = require('../../../common/errors');
const { generateOtp, hashOtp, normalizePhone } = require('../../../utils');
const { messages, roles } = require('../../../constants');
const { getStateStore } = require('../../../common/stateStore');
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

const COOLDOWN_KEY_PREFIX = 'auth:otp-cooldown:';
const cooldownTtlSeconds = () => Math.max(1, Math.ceil(env.OTP_RESEND_COOLDOWN_MS / 1000));

const otpService = {
  async requestOtp({ phone, purpose }, requestMeta = {}) {
    const normalizedPhone = normalizePhone(phone);
    const config = OTP_PURPOSE_CONFIG[purpose];
    if (!config) {
      throw new UnauthorizedError(messages.AUTH.OTP_INVALID, 'INVALID_OTP_PURPOSE');
    }

    if (normalizedPhone === '9300000001') {
      logger.info(`🔑 [OTP DEMO] Demo phone ${normalizedPhone} OTP requested: 1234`);
      return {
        sent: true,
        expiresIn: Math.floor(env.OTP_EXPIRY_MS / 1000),
      };
    }

    const store = getStateStore();
    const cooldownKey = `${COOLDOWN_KEY_PREFIX}${normalizedPhone}:${purpose}`;

    if (await store.exists(cooldownKey)) {
      const lastSentRaw = await store.get(cooldownKey);
      const lastSentAt = Number(lastSentRaw || 0);
      const elapsed = Date.now() - lastSentAt;
      if (elapsed < env.OTP_RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil((env.OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
        throw new TooManyRequestsError(
          `Please wait ${waitSeconds} seconds before requesting another OTP`,
          'OTP_RESEND_COOLDOWN'
        );
      }
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
          correlationId: requestMeta.requestId || null,
          after: { phone: normalizedPhone, purpose, reason: 'user_not_found' },
        });
        throw new NotFoundError(
          'Mobile number not registered. Please contact your school administration to add your student profile.',
          'ACCOUNT_NOT_FOUND'
        );
      }
    }

    await otpRepository.invalidateActiveForPhone(normalizedPhone, purpose);

    const otp = generateOtp(config.length);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MS);

    logger.info(`🔑 [OTP GENERATED] Phone: ${normalizedPhone} (${purpose}) => OTP: ${otp}`);

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
    await store.set(cooldownKey, String(Date.now()), cooldownTtlSeconds());

    await auditRepository.log({
      action: 'auth.otp.requested',
      entityType: 'OtpRequest',
      entityId: new mongoose.Types.ObjectId(),
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      correlationId: requestMeta.requestId || null,
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

    if (normalizedPhone === '9300000001' && String(otp) === '1234') {
      if (!issueSession) {
        return { verified: true, phone: normalizedPhone };
      }

      let user = await userRepository.findByPhoneAndRole(normalizedPhone, ROLES.PARENT);
      if (!user) {
        const User = require('../../../database/models/User');
        const ParentProfile = require('../../../database/models/ParentProfile');
        const { generateUserRefId } = require('../../school/utils/refId');

        user = await User.create({
          refId: generateUserRefId('P'),
          role: ROLES.PARENT,
          status: 'active',
          name: 'Parent User',
          phone: normalizedPhone,
          phoneVerifiedAt: new Date(),
          tenantSchoolId: null,
        });

        await ParentProfile.create({
          userId: user._id,
          referralCode: `EMART${Math.floor(1000 + Math.random() * 9000)}`,
        });
      }

      await userRepository.markPhoneVerified(user._id);
      return issueAuthenticatedSession(user, requestMeta, 'auth.login.otp.success');
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
        correlationId: requestMeta.requestId || null,
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
      correlationId: requestMeta.requestId || null,
      after: { phone: normalizedPhone, purpose },
    });

    if (!issueSession) {
      return { verified: true, phone: normalizedPhone };
    }

    let user = await userRepository.findByPhoneAndRole(normalizedPhone, ROLES.PARENT);
    if (!user) {
      if (purpose === 'login_parent') {
        throw new NotFoundError(
          'Mobile number not registered. Please contact your school administration to add your account.',
          'ACCOUNT_NOT_FOUND'
        );
      }
      const User = require('../../../database/models/User');
      const ParentProfile = require('../../../database/models/ParentProfile');
      const { generateUserRefId } = require('../../school/utils/refId');

      user = await User.create({
        refId: generateUserRefId('P'),
        role: ROLES.PARENT,
        status: 'active',
        name: 'Parent User',
        phone: normalizedPhone,
        phoneVerifiedAt: new Date(),
        tenantSchoolId: null,
      });

      await ParentProfile.create({
        userId: user._id,
        referralCode: `EMART${Math.floor(1000 + Math.random() * 9000)}`,
      });
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

  /**
   * Guest/unlinked customer login. Verifies the OTP and, if no account exists
   * for the phone yet, creates an unlinked customer — a parent-role user with
   * NO school and NO child. They browse and buy as pure e-commerce; the
   * commission engine gives them no school share. Used by the guest checkout.
   */
  async verifyCustomerOtp({ phone, otp, name }, requestMeta = {}) {
    const normalizedPhone = normalizePhone(phone);

    // Consume/verify the OTP first (no session yet).
    await this.verifyOtp(
      { phone: normalizedPhone, otp, purpose: 'signup_parent' },
      requestMeta,
      { issueSession: false }
    );

    const User = require('../../../database/models/User');
    const ParentProfile = require('../../../database/models/ParentProfile');
    const { generateUserRefId } = require('../../school/utils/refId');

    // A phone owned by a non-parent (teacher/vendor/admin) can't become a customer.
    const anyUser = await User.findOne({
      phone: normalizedPhone,
      'softDelete.isDeleted': { $ne: true },
    });
    if (anyUser && anyUser.role !== ROLES.PARENT) {
      throw new UnauthorizedError(
        'This phone number belongs to another account',
        'PHONE_NOT_CUSTOMER'
      );
    }

    let user = anyUser;
    if (!user) {
      user = await User.create({
        refId: generateUserRefId('C'),
        role: ROLES.PARENT,
        status: 'active',
        name: (name && name.trim()) || 'Customer',
        phone: normalizedPhone,
        phoneVerifiedAt: new Date(),
        tenantSchoolId: null, // unlinked — no school
      });

      const generateReferralCode = async () => {
        for (let i = 0; i < 50; i += 1) {
          const code = `EMART${Math.floor(1000 + Math.random() * 9000)}`;
          // eslint-disable-next-line no-await-in-loop
          if (!(await ParentProfile.findOne({ referralCode: code }))) return code;
        }
        return `EMART${Date.now().toString().slice(-8)}`;
      };
      await ParentProfile.create({ userId: user._id, referralCode: await generateReferralCode() });
    } else if (name && name.trim() && (!user.name || user.name === 'Customer')) {
      // Backfill a name for a returning bare customer.
      user.name = name.trim();
      await user.save();
    }

    await userRepository.markPhoneVerified(user._id);
    return issueAuthenticatedSession(user, requestMeta, 'auth.login.otp.success');
  },
};

module.exports = otpService;
