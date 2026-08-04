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
    // rebuilds childInfo (header, greetings, etc.) from it. Without childProfile
    // here the student name gets overwritten with the parent's name on refresh,
    // so attach the active child exactly like login does.
    const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
    if (obj.role === 'parent' || obj.role === 'user') {
      obj.childProfile = await buildActiveChildDto(userId);
      obj.profile = await buildProfileDto(userId, obj.role);
    }
    return obj;
  },
};

async function buildProfileDto(userId, userRole) {
  const ParentProfile = require('../../../database/models/ParentProfile');
  const Address = require('../../../database/models/Address');
  const parentProfile = await ParentProfile.findOne({
    userId,
    'softDelete.isDeleted': { $ne: true },
  }).lean();

  let defaultAddress = null;
  if (parentProfile?.defaultAddressId) {
    defaultAddress = await Address.findById(parentProfile.defaultAddressId).lean();
  }

  return {
    altPhone: parentProfile?.altPhone || null,
    avatarUrl: parentProfile?.avatarUrl || null,
    referralCode: parentProfile?.referralCode || null,
    address: defaultAddress?.line1 || null,
    pinCode: defaultAddress?.pinCode || null,
    city: defaultAddress?.city || null,
    state: defaultAddress?.state || null,
    country: defaultAddress?.country || null,
  };
}

// Builds the active-child DTO for a parent (mirrors sessionIssue.service and
// users.service). Active child = ParentProfile.activeChildId, else the first.
async function buildActiveChildDto(userId) {
  const ParentProfile = require('../../../database/models/ParentProfile');
  const ChildProfile = require('../../../database/models/ChildProfile');
  const School = require('../../../database/models/School');

  const parentProfile = await ParentProfile.findOne({
    userId,
    'softDelete.isDeleted': { $ne: true },
  }).lean();

  const children = await ChildProfile.find({
    parentUserId: userId,
    'softDelete.isDeleted': { $ne: true },
  })
    .sort({ 'audit.createdAt': 1 })
    .lean();
  if (!children.length) return null;

  const child =
    children.find(
      (c) => parentProfile?.activeChildId && String(c._id) === String(parentProfile.activeChildId)
    ) || children[0];

  const school = child.schoolId ? await School.findById(child.schoolId).lean() : null;
  return {
    name: child.name,
    grade: child.grade,
    schoolId: child.schoolId ? child.schoolId.toString() : 'explore-schools',
    schoolName: school ? school.name : 'Explore Schools',
    schoolLogo: school ? school.logoUrl : null,
    schoolRefNo: child.schoolRefNo || (school ? school.schoolRefNo : null),
    rollNo: child.rollNo || null,
    studentId: child.studentId ? child.studentId.toString() : null,
    photo: child.avatarUrl || null,
    avatarUrl: child.avatarUrl || null,
  };
}

module.exports = authService;
