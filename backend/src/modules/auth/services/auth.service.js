const {
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
} = require('../../../common/errors');
const mongoose = require('mongoose');
const { verifyPassword, normalizeEmail } = require('../../../utils');
const { messages, roles, permissions: permissionConstants } = require('../../../constants');
const { ROLES } = roles;
const { ROLE_DEFAULT_PERMISSIONS } = permissionConstants;
const { hashToken } = require('../../../utils');
const authConfig = require('../../../config/auth');
const userRepository = require('../repositories/user.repository');
const profileRepository = require('../repositories/profile.repository');
const sessionRepository = require('../repositories/session.repository');
const auditRepository = require('../repositories/audit.repository');
const loginAttemptTracker = require('./loginAttempt.service');
const tokenService = require('./token.service');
const { mapUserToDto } = require('../mappers/auth.mapper');

const resolveAuthorizationContext = async (user) => {
  let permissions = ROLE_DEFAULT_PERMISSIONS[user.role] || [];
  let scopes = [];
  let profile = null;

  switch (user.role) {
    case ROLES.SCHOOL_ADMIN: {
      const staffProfile = await profileRepository.getSchoolStaffByUserId(user._id);
      if (staffProfile) {
        permissions = staffProfile.permissions?.length
          ? staffProfile.permissions
          : permissions;
        profile = { schoolId: staffProfile.schoolId?.toString() };
      }
      break;
    }
    case ROLES.TEACHER: {
      const teacherProfile = await profileRepository.getTeacherByUserId(user._id);
      if (teacherProfile) {
        profile = {
          schoolId: teacherProfile.schoolId?.toString(),
          approvalStatus: teacherProfile.approvalStatus,
        };
      }
      break;
    }
    case ROLES.VENDOR: {
      const vendorProfile = await profileRepository.getVendorByUserId(user._id);
      if (vendorProfile) {
        profile = {
          storeName: vendorProfile.storeName,
          approvalStatus: vendorProfile.approvalStatus,
        };
      }
      break;
    }
    case ROLES.SUPER_ADMIN: {
      const adminProfile = await profileRepository.getAdminByUserId(user._id);
      if (adminProfile) {
        scopes = adminProfile.scopes?.length ? adminProfile.scopes : ['*'];
        profile = {
          firstName: adminProfile.firstName,
          lastName: adminProfile.lastName,
        };
      }
      break;
    }
    default:
      break;
  }

  return { permissions, scopes, profile };
};

const assertAccountEligible = async (user) => {
  if (user.status === 'suspended') {
    throw new ForbiddenError(messages.AUTH.ACCOUNT_SUSPENDED, 'ACCOUNT_SUSPENDED');
  }
  if (user.status === 'inactive') {
    throw new ForbiddenError(messages.AUTH.ACCOUNT_INACTIVE, 'ACCOUNT_INACTIVE');
  }

  if (user.role === ROLES.TEACHER) {
    const teacherProfile = await profileRepository.getTeacherByUserId(user._id);
    if (teacherProfile?.approvalStatus === 'rejected') {
      throw new ForbiddenError(messages.AUTH.TEACHER_NOT_APPROVED, 'TEACHER_REJECTED');
    }
    if (teacherProfile?.approvalStatus === 'pending' || user.status === 'pending_approval') {
      throw new ForbiddenError(messages.AUTH.TEACHER_NOT_APPROVED, 'TEACHER_PENDING');
    }
  }

  if (user.role === ROLES.VENDOR) {
    const vendorProfile = await profileRepository.getVendorByUserId(user._id);
    if (vendorProfile?.approvalStatus === 'pending') {
      throw new ForbiddenError(messages.AUTH.VENDOR_NOT_APPROVED, 'VENDOR_PENDING');
    }
    if (vendorProfile?.approvalStatus === 'suspended') {
      throw new ForbiddenError(messages.AUTH.ACCOUNT_SUSPENDED, 'VENDOR_SUSPENDED');
    }
  }
};

const authService = {
  async loginWithPassword({ email, password, expectedRole }, requestMeta = {}) {
    const normalizedEmail = normalizeEmail(email);
    const lockKey = normalizedEmail;

    if (loginAttemptTracker.isLocked(lockKey, requestMeta.ipAddress)) {
      const remainingMs = loginAttemptTracker.getRemainingLockMs(lockKey, requestMeta.ipAddress);
      throw new TooManyRequestsError(
        `${messages.AUTH.ACCOUNT_LOCKED}. Try again in ${Math.ceil(remainingMs / 60000)} minutes.`,
        'ACCOUNT_LOCKED'
      );
    }

    const user = expectedRole
      ? await userRepository.findByEmailAndRole(normalizedEmail, expectedRole)
      : await userRepository.findByEmail(normalizedEmail);

    if (!user || !user.passwordHash) {
      loginAttemptTracker.recordFailure(lockKey, requestMeta.ipAddress);
      await auditRepository.log({
        action: 'auth.login.failed',
        entityType: 'User',
        entityId: user?._id || new mongoose.Types.ObjectId(),
        actorRole: expectedRole || null,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        after: { reason: 'invalid_credentials', email: normalizedEmail },
      });
      throw new UnauthorizedError(messages.AUTH.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
    }

    if (expectedRole && user.role !== expectedRole) {
      throw new UnauthorizedError(messages.AUTH.ROLE_MISMATCH, 'ROLE_MISMATCH');
    }

    const passwordValid = await verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      loginAttemptTracker.recordFailure(lockKey, requestMeta.ipAddress);
      await auditRepository.log({
        actorUserId: user._id,
        actorRole: user.role,
        action: 'auth.login.failed',
        entityType: 'User',
        entityId: user._id,
        ipAddress: requestMeta.ipAddress,
        userAgent: requestMeta.userAgent,
        after: { reason: 'invalid_password' },
      });
      throw new UnauthorizedError(messages.AUTH.INVALID_CREDENTIALS, 'INVALID_CREDENTIALS');
    }

    await assertAccountEligible(user);
    loginAttemptTracker.reset(lockKey, requestMeta.ipAddress);

    const authContext = await resolveAuthorizationContext(user);
    const tokens = await tokenService.createSessionTokens(
      user,
      { permissions: authContext.permissions, scopes: authContext.scopes },
      requestMeta
    );

    const updatedUser = await userRepository.updateLoginSuccess(user._id);

    await auditRepository.log({
      actorUserId: user._id,
      actorRole: user.role,
      action: 'auth.login.success',
      entityType: 'AuthSession',
      entityId: user._id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      after: { jti: tokens.jti },
    });

    return {
      ...tokens,
      user: mapUserToDto(updatedUser || user, authContext),
      expiresIn: Math.floor(authConfig.accessExpiryMs / 1000),
    };
  },

  async refreshSession(refreshToken, requestMeta = {}) {
    const incomingHash = hashToken(refreshToken);
    const existingSession = await sessionRepository.findActiveByRefreshHash(incomingHash);
    if (!existingSession) {
      throw new UnauthorizedError(messages.AUTH.INVALID_TOKEN, 'INVALID_REFRESH_TOKEN');
    }

    const existingUser = await userRepository.findActiveById(existingSession.userId);
    const authContext = await resolveAuthorizationContext(existingUser);

    const tokens = await tokenService.rotateRefreshToken(refreshToken, {
      ...requestMeta,
      authContext: { permissions: authContext.permissions, scopes: authContext.scopes },
    });

    const user = await userRepository.findActiveById(existingUser._id);

    return {
      ...tokens,
      user: mapUserToDto(user, authContext),
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
    const authContext = await resolveAuthorizationContext(user);
    return mapUserToDto(user, authContext);
  },

  async listSessions(userId, currentJti) {
    const sessions = await sessionRepository.findActiveByUserId(userId);
    return sessions.map((session) => ({
      id: session._id.toString(),
      device: session.device || {},
      ipAddress: session.ipAddress,
      lastSeenAt: session.lastSeenAt,
      expiresAt: session.expiresAt,
      current: session.jti === currentJti,
    }));
  },
};

module.exports = authService;
