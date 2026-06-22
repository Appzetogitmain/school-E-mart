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

  return {
    ...tokens,
    user: mapUserToDto(updatedUser || user, authContext),
    expiresIn: Math.floor(authConfig.accessExpiryMs / 1000),
  };
};

module.exports = {
  resolveAuthorizationContext,
  assertAccountEligible,
  issueAuthenticatedSession,
};
