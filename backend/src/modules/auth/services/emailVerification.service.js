const jwt = require('jsonwebtoken');
const env = require('../../../config/env');
const {
  UnauthorizedError,
  ConflictError,
  ValidationError,
} = require('../../../common/errors');
const { normalizeEmail } = require('../../../utils');
const { messages } = require('../../../constants');
const emailService = require('../../../common/email');
const userRepository = require('../repositories/user.repository');
const auditRepository = require('../repositories/audit.repository');

const EMAIL_VERIFY_TYPE = 'email_verify';

const emailVerificationService = {
  signVerificationToken(user) {
    if (!user.email) {
      throw new ValidationError('Email address is required for verification', {
        email: 'No email address on account',
      });
    }

    return jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        type: EMAIL_VERIFY_TYPE,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.EMAIL_VERIFICATION_EXPIRY,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
      }
    );
  },

  verifyVerificationToken(token) {
    try {
      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
        algorithms: ['HS256'],
      });

      if (payload.type !== EMAIL_VERIFY_TYPE) {
        throw new UnauthorizedError(messages.AUTH.INVALID_TOKEN, 'INVALID_VERIFICATION_TOKEN');
      }

      return payload;
    } catch {
      throw new UnauthorizedError(messages.AUTH.INVALID_TOKEN, 'INVALID_VERIFICATION_TOKEN');
    }
  },

  async sendVerificationEmail(userId, requestMeta = {}) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED);
    }

    if (user.emailVerifiedAt) {
      throw new ConflictError(messages.AUTH.EMAIL_ALREADY_VERIFIED, 'EMAIL_ALREADY_VERIFIED');
    }

    if (!user.email) {
      throw new ValidationError('Email address is required for verification', {
        email: 'No email address on account',
      });
    }

    const token = this.signVerificationToken(user);
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${token}`;

    await emailService.sendEmailVerification({
      to: user.email,
      name: user.name,
      verifyUrl,
      token,
    });

    await auditRepository.log({
      actorUserId: user._id,
      actorRole: user.role,
      action: 'auth.email.verification.sent',
      entityType: 'User',
      entityId: user._id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return { message: messages.AUTH.VERIFICATION_SENT };
  },

  async verifyEmail({ token }, requestMeta = {}) {
    const payload = this.verifyVerificationToken(token);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError(messages.AUTH.INVALID_TOKEN, 'INVALID_VERIFICATION_TOKEN');
    }

    if (normalizeEmail(user.email) !== normalizeEmail(payload.email)) {
      throw new UnauthorizedError(messages.AUTH.INVALID_TOKEN, 'EMAIL_MISMATCH');
    }

    if (user.emailVerifiedAt) {
      return { message: messages.AUTH.EMAIL_ALREADY_VERIFIED, alreadyVerified: true };
    }

    await userRepository.markEmailVerified(user._id);

    await auditRepository.log({
      actorUserId: user._id,
      actorRole: user.role,
      action: 'auth.email.verified',
      entityType: 'User',
      entityId: user._id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return { message: messages.AUTH.EMAIL_VERIFIED, alreadyVerified: false };
  },
};

module.exports = emailVerificationService;
