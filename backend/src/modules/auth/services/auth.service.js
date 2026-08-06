const {
  UnauthorizedError,
  TooManyRequestsError,
} = require('../../../common/errors');
const mongoose = require('mongoose');
const { verifyPassword, normalizeEmail } = require('../../../utils');
const { messages } = require('../../../constants');
const authConfig = require('../../../config/auth');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const auditRepository = require('../repositories/audit.repository');
const loginAttemptTracker = require('./loginAttempt.service');
const tokenService = require('./token.service');
const { issueAuthenticatedSession } = require('./sessionIssue.service');
const { mapUserToDto } = require('../mappers/auth.mapper');

const authService = {
  async loginWithPassword({ email, password, expectedRole }, requestMeta = {}) {
    const normalizedEmail = normalizeEmail(email);
    const lockKey = normalizedEmail;

    if (await loginAttemptTracker.isLocked(lockKey, requestMeta.ipAddress)) {
      const remainingMs = await loginAttemptTracker.getRemainingLockMs(lockKey, requestMeta.ipAddress);
      throw new TooManyRequestsError(
        `${messages.AUTH.ACCOUNT_LOCKED}. Try again in ${Math.ceil(remainingMs / 60000)} minutes.`,
        'ACCOUNT_LOCKED'
      );
    }

    const user = expectedRole
      ? await userRepository.findByEmailAndRole(normalizedEmail, expectedRole)
      : await userRepository.findByEmail(normalizedEmail);

    if (!user || !user.passwordHash) {
      await loginAttemptTracker.recordFailure(lockKey, requestMeta.ipAddress);
      await auditRepository.log({
        action: 'auth.login.failed',
        entityType: 'User',
        entityId: user?._id || new mongoose.Types.ObjectId(),
        actorRole: expectedRole || null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        correlationId: requestMeta.requestId || null,
        after: { reason: 'invalid_credentials', email: normalizedEmail },
      });
      throw new UnauthorizedError(messages.AUTH.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
    }

    if (expectedRole && user.role !== expectedRole) {
      throw new UnauthorizedError(messages.AUTH.ROLE_MISMATCH, 'ROLE_MISMATCH');
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      await loginAttemptTracker.recordFailure(lockKey, requestMeta.ipAddress);
      await auditRepository.log({
        actorUserId: user._id,
        actorRole: user.role,
        action: 'auth.login.failed',
        entityType: 'User',
        entityId: user._id,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        correlationId: requestMeta.requestId || null,
        after: { reason: 'invalid_password' },
      });
      throw new UnauthorizedError(messages.AUTH.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
    }

    await loginAttemptTracker.reset(lockKey, requestMeta.ipAddress);
    return issueAuthenticatedSession(user, requestMeta, 'auth.login.success');
  },

  async refreshSession(refreshToken, requestMeta = {}) {
    const result = await tokenService.rotateRefreshToken(refreshToken, requestMeta);

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt,
      user: mapUserToDto(result.user, result.authContext),
      expiresIn: Math.floor(authConfig.accessExpiryMs / 1000),
    };
  },

  async logout({ userId, jti, sessionId, revokeAll = false }) {
    if (revokeAll) {
      await sessionRepository.revokeAllForUser(userId);
    } else if (sessionId) {
      await sessionRepository.revokeById(sessionId);
    } else if (jti) {
      await sessionRepository.revokeByJti(jti);
    }

    await auditRepository.log({
      actorUserId: userId,
      action: revokeAll ? 'auth.logout.all' : 'auth.logout',
      entityType: 'AuthSession',
      entityId: userId,
      after: { jti, revokeAll },
    });
  },

  async getCurrentUser(userId) {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED);
    }

    // /auth/me is called on every app load and token refresh, and the client
    // rebuilds childInfo (header, greetings, school name/logo, etc.) from it.
    // Without profile/childProfile here the client falls back to stale or
    // placeholder identity on refresh, so attach it for every role that
    // needs it — reusing usersService.getProfile(), the same builder that
    // already backs GET /users/me, instead of a second parent-only copy of
    // this logic that left teacher/school with no real data.
    // 'vendor' was missing here, so a vendor's approvalStatus/verifiedBadge
    // (correctly present right after login) vanished from `user.profile` on
    // the very next token refresh or app load — anything gating on it
    // (e.g. the sidebar's verified/pending badge) lost the real status.
    const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    if (['parent', 'user', 'teacher', 'school', 'vendor'].includes(obj.role)) {
      const usersService = require('../../users/services/users.service');
      const { profile, childProfile } = await usersService.getProfile(userId);
      obj.childProfile = childProfile;
      obj.profile = profile;
    }
    return obj;
  },
};

module.exports = authService;
