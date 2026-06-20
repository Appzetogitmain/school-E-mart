const authService = require('../services/auth.service');
const { success } = require('../../../common/response');
const { toAuthResponseDto } = require('../dto/auth.dto');
const { messages } = require('../../../constants');
const env = require('../../../config/env');
const security = require('../../../config/security');

const getRequestMeta = (req) => ({
  ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
  userAgent: req.headers['user-agent'] || null,
  device: {
    app: req.headers['x-client-app'] || 'web',
    os: req.headers['x-client-os'] || null,
    model: req.headers['x-client-model'] || null,
  },
});

const setRefreshCookie = (res, refreshToken, expiresAt) => {
  res.cookie(env.REFRESH_COOKIE_NAME, refreshToken, {
    ...security.cookie,
    expires: expiresAt,
    maxAge: expiresAt.getTime() - Date.now(),
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(env.REFRESH_COOKIE_NAME, {
    ...security.cookie,
  });
};

const sendAuthResponse = (res, result, message) => {
  setRefreshCookie(res, result.refreshToken, result.expiresAt);
  return success(
    res,
    toAuthResponseDto({
      user: result.user,
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    }),
    message
  );
};

const authController = {
  login: (expectedRole = null) => async (req, res, next) => {
    try {
      const result = await authService.loginWithPassword(
        {
          email: req.body.email,
          password: req.body.password,
          expectedRole: expectedRole || req.body.role || null,
        },
        getRequestMeta(req)
      );
      return sendAuthResponse(res, result, messages.AUTH.LOGIN_SUCCESS);
    } catch (error) {
      return next(error);
    }
  },

  refresh: async (req, res, next) => {
    try {
      const refreshToken =
        req.cookies?.[env.REFRESH_COOKIE_NAME] || req.body?.refreshToken || null;
      const result = await authService.refreshSession(refreshToken, getRequestMeta(req));
      return sendAuthResponse(res, result, messages.AUTH.TOKEN_REFRESHED);
    } catch (error) {
      clearRefreshCookie(res);
      return next(error);
    }
  },

  logout: async (req, res, next) => {
    try {
      await authService.logout({
        userId: req.auth.userId,
        jti: req.auth.jti,
        sessionId: req.auth.sessionId,
        revokeAll: req.body.revokeAll,
      });
      clearRefreshCookie(res);
      return success(res, null, messages.AUTH.LOGOUT_SUCCESS);
    } catch (error) {
      return next(error);
    }
  },

  me: async (req, res, next) => {
    try {
      const user = await authService.getCurrentUser(req.auth.userId);
      return success(res, { user });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = authController;
