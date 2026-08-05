const userRepository = require('../repositories/user.repository');
const auditRepository = require('../repositories/audit.repository');
const tokenService = require('./token.service');
const { mapUserToDto } = require('../mappers/auth.mapper');
const authConfig = require('../../../config/auth');
const {
  resolveAuthorizationContext,
  assertAccountEligible,
} = require('./authorizationContext.service');

const issueAuthenticatedSession = async (user, requestMeta = {}, auditAction = 'auth.login.success') => {
  await assertAccountEligible(user);

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
    action: auditAction,
    entityType: 'AuthSession',
    entityId: user._id,
    ipAddress: requestMeta.ipAddress,
    userAgent: requestMeta.userAgent,
    correlationId: requestMeta.requestId || null,
    after: { jti: tokens.jti },
  });

  const userDto = mapUserToDto(updatedUser || user, authContext);

  // Login must return the same real profile (school name/logo, store name,
  // etc.) that GET /users/me returns — otherwise the client falls back to
  // stale/placeholder identity until the user happens to hit a page that
  // re-fetches it. usersService.getProfile() already builds the right shape
  // per role (including the school/teacher lookups), so reuse it here
  // instead of maintaining a second, parent-only copy of this logic.
  if (['parent', 'teacher', 'school', 'vendor'].includes(user.role)) {
    const usersService = require('../../users/services/users.service');
    const { profile, childProfile } = await usersService.getProfile(user._id);
    if (childProfile) userDto.childProfile = childProfile;
    if (profile) userDto.profile = profile;
  }

  return {
    ...tokens,
    user: userDto,
    expiresIn: Math.floor(authConfig.accessExpiryMs / 1000),
  };
};

module.exports = {
  resolveAuthorizationContext,
  assertAccountEligible,
  issueAuthenticatedSession,
};
