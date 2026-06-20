const { v4: uuidv4 } = require('uuid');
const authConfig = require('../../../config/auth');
const { signAccessToken } = require('../../../common/tokens');
const { hashToken } = require('../../../utils');
const sessionRepository = require('../repositories/session.repository');
const userRepository = require('../repositories/user.repository');
const { UnauthorizedError } = require('../../../common/errors');
const { messages } = require('../../../constants');

const buildTokenPayload = (user, sessionJti, permissions = [], scopes = []) => ({
  sub: user._id.toString(),
  jti: sessionJti,
  role: user.role,
  refId: user.refId,
  tenantSchoolId: user.tenantSchoolId?.toString() || null,
  permissions,
  scopes,
});

const tokenService = {
  async createSessionTokens(user, { permissions = [], scopes = [] } = {}, meta = {}) {
    const jti = uuidv4();
    const refreshToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + authConfig.refreshExpiryMs);

    await sessionRepository.create({
      userId: user._id,
      jti,
      refreshTokenHash: hashToken(refreshToken),
      device: meta.device || {},
      ipAddress: meta.ipAddress || null,
      lastSeenAt: new Date(),
      expiresAt,
    });

    const payload = buildTokenPayload(user, jti, permissions, scopes);
    const accessToken = signAccessToken(payload);

    return {
      accessToken,
      refreshToken,
      jti,
      expiresAt,
      permissions,
      scopes,
    };
  },

  async rotateRefreshToken(refreshToken, meta = {}) {
    if (!refreshToken) {
      throw new UnauthorizedError(messages.AUTH.REFRESH_TOKEN_REQUIRED, 'REFRESH_TOKEN_REQUIRED');
    }

    const incomingHash = hashToken(refreshToken);
    const session = await sessionRepository.findActiveByRefreshHash(incomingHash);

    if (!session) {
      throw new UnauthorizedError(messages.AUTH.INVALID_TOKEN, 'INVALID_REFRESH_TOKEN');
    }

    const user = await userRepository.findActiveById(session.userId);
    if (!user) {
      await sessionRepository.revokeById(session._id);
      throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED);
    }

    await sessionRepository.revokeById(session._id);

    const { permissions = [], scopes = [] } = meta.authContext || {};
    return this.createSessionTokens(user, { permissions, scopes }, meta);
  },
};

module.exports = tokenService;
