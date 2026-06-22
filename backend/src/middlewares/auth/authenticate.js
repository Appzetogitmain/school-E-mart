const { UnauthorizedError, ForbiddenError } = require('../../common/errors');
const { verifyAccessToken } = require('../../common/tokens');
const sessionRepository = require('../../modules/auth/repositories/session.repository');
const userRepository = require('../../modules/auth/repositories/user.repository');
const { assertAccountEligible } = require('../../modules/auth/services/authorizationContext.service');
const { messages } = require('../../constants');

const SESSION_TOUCH_INTERVAL_MS = 5 * 60 * 1000;

const extractBearerToken = (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
};

const authenticate = async (req, _res, next) => {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED);
    }

    const payload = verifyAccessToken(token);
    const session = await sessionRepository.findActiveByJti(payload.jti);
    if (!session) {
      throw new UnauthorizedError(messages.AUTH.SESSION_REVOKED, 'SESSION_REVOKED');
    }

    const user = await userRepository.findActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED);
    }

    if (user.status === 'suspended') {
      throw new ForbiddenError(messages.AUTH.ACCOUNT_SUSPENDED, 'ACCOUNT_SUSPENDED');
    }

    if (user.status === 'inactive') {
      throw new ForbiddenError(messages.AUTH.ACCOUNT_INACTIVE, 'ACCOUNT_INACTIVE');
    }

    await assertAccountEligible(user);

    req.auth = {
      userId: user._id.toString(),
      jti: payload.jti,
      sessionId: session._id.toString(),
      role: user.role,
      refId: user.refId,
      tenantSchoolId: user.tenantSchoolId?.toString() || null,
      permissions: payload.permissions || [],
      scopes: payload.scopes || [],
      roleScopes: user.roleScopes || [],
    };
    req.user = user;

    const lastSeenAt = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
    if (Date.now() - lastSeenAt > SESSION_TOUCH_INTERVAL_MS) {
      await sessionRepository.touch(session._id);
    }

    return next();
  } catch (error) {
    return next(error);
  }
};

const optionalAuthenticate = async (req, res, next) => {
  const token = extractBearerToken(req);
  if (!token) return next();
  return authenticate(req, res, next);
};

module.exports = {
  authenticate,
  optionalAuthenticate,
  extractBearerToken,
};
