const env = require('../../../config/env');
const jwt = require('jsonwebtoken');
const {
  UnauthorizedError,
  ValidationError,
  NotFoundError,
} = require('../../../common/errors');
const { hashPassword, verifyPassword, hashToken, generateSecureToken, normalizeEmail } = require('../../../utils');
const { messages, roles } = require('../../../constants');
const emailService = require('../../../common/email');
const userRepository = require('../repositories/user.repository');
const passwordResetRepository = require('../repositories/passwordReset.repository');
const sessionRepository = require('../repositories/session.repository');
const auditRepository = require('../repositories/audit.repository');

const { PASSWORD_ROLES } = roles;

const passwordService = {
  async forgotPassword({ email }, requestMeta = {}) {
    const normalizedEmail = normalizeEmail(email);
    const user = await userRepository.findByEmail(normalizedEmail);

    if (user && user.passwordHash && PASSWORD_ROLES.includes(user.role)) {
      await passwordResetRepository.invalidateActiveForUser(user._id);

      const rawToken = generateSecureToken(32);
      const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRY_MS);

      await passwordResetRepository.create({
        userId: user._id,
        tokenHash: hashToken(rawToken),
        expiresAt,
      });

      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

      await emailService.sendPasswordResetEmail({
        to: normalizedEmail,
        name: user.name,
        resetUrl,
        token: rawToken,
      });

      await auditRepository.log({
        actorUserId: user._id,
        actorRole: user.role,
        action: 'auth.password.forgot.requested',
        entityType: 'PasswordReset',
        entityId: user._id,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
      });
    }

    return { message: messages.AUTH.PASSWORD_RESET_SENT };
  },

  async resetPassword({ token, newPassword }, requestMeta = {}) {
    const tokenHash = hashToken(token);
    const resetRecord = await passwordResetRepository.findActiveByTokenHash(tokenHash);

    if (!resetRecord) {
      throw new UnauthorizedError(messages.AUTH.INVALID_TOKEN, 'INVALID_RESET_TOKEN');
    }

    const user = await userRepository.findById(resetRecord.userId);
    if (!user || !PASSWORD_ROLES.includes(user.role)) {
      throw new UnauthorizedError(messages.AUTH.INVALID_TOKEN, 'INVALID_RESET_TOKEN');
    }

    const { hash, algo } = await hashPassword(newPassword);
    await userRepository.updatePassword(user._id, hash, algo);
    await passwordResetRepository.markConsumed(resetRecord._id);
    await sessionRepository.revokeAllForUser(user._id);

    await auditRepository.log({
      actorUserId: user._id,
      actorRole: user.role,
      action: 'auth.password.reset.completed',
      entityType: 'User',
      entityId: user._id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return { message: messages.AUTH.PASSWORD_RESET_SUCCESS };
  },

  async changePassword({ userId, currentPassword, newPassword, sessionId }, requestMeta = {}) {
    const user = await userRepository.findById(userId);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED);
    }

    const currentValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!currentValid) {
      throw new UnauthorizedError(messages.AUTH.CURRENT_PASSWORD_INVALID, 'CURRENT_PASSWORD_INVALID');
    }

    if (currentPassword === newPassword) {
      throw new ValidationError('New password must be different from current password', {
        newPassword: 'New password must be different from current password',
      });
    }

    const { hash, algo } = await hashPassword(newPassword);
    await userRepository.updatePassword(user._id, hash, algo);
    await sessionRepository.revokeAllForUser(user._id, sessionId);

    await auditRepository.log({
      actorUserId: user._id,
      actorRole: user.role,
      action: 'auth.password.changed',
      entityType: 'User',
      entityId: user._id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
    });

    return { message: messages.AUTH.PASSWORD_CHANGED };
  },
};

module.exports = passwordService;
