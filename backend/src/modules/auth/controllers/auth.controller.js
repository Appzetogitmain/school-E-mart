const authService = require('../services/auth.service');
const otpService = require('../services/otp.service');
const passwordService = require('../services/password.service');
const emailVerificationService = require('../services/emailVerification.service');
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

  requestParentOtp: (purpose = 'login_parent') => async (req, res, next) => {
    try {
      const phone = req.body.phone || req.body.mobile;
      const result = await otpService.requestOtp({ phone, purpose }, getRequestMeta(req));
      return success(res, result, messages.AUTH.OTP_SENT);
    } catch (error) {
      return next(error);
    }
  },

  verifyParentOtp: async (req, res, next) => {
    try {
      const result = await otpService.loginParentWithOtp(
        {
          phone: req.body.phone || req.body.mobile,
          otp: req.body.otp,
          purpose: 'login_parent',
        },
        getRequestMeta(req)
      );
      return sendAuthResponse(res, result, messages.AUTH.OTP_VERIFIED);
    } catch (error) {
      return next(error);
    }
  },

  parentWebLogin: async (req, res, next) => {
    try {
      const result = await otpService.loginParentWithOtp(
        { phone: req.body.mobile, otp: req.body.otp, purpose: 'login_parent' },
        getRequestMeta(req)
      );
      return sendAuthResponse(res, result, messages.AUTH.LOGIN_SUCCESS);
    } catch (error) {
      return next(error);
    }
  },

  verifyWebRegisterOtp: async (req, res, next) => {
    try {
      const result = await otpService.verifyOtp(
        {
          phone: req.body.phone || req.body.mobile,
          otp: req.body.otp,
          purpose: 'web_register',
        },
        getRequestMeta(req),
        { issueSession: false }
      );
      return success(res, result, messages.AUTH.OTP_VERIFIED);
    } catch (error) {
      return next(error);
    }
  },

  forgotPassword: async (req, res, next) => {
    try {
      const result = await passwordService.forgotPassword(
        { email: req.body.email },
        getRequestMeta(req)
      );
      return success(res, null, result.message);
    } catch (error) {
      return next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const result = await passwordService.resetPassword(
        { token: req.body.token, newPassword: req.body.newPassword },
        getRequestMeta(req)
      );
      return success(res, null, result.message);
    } catch (error) {
      return next(error);
    }
  },

  changePassword: async (req, res, next) => {
    try {
      const result = await passwordService.changePassword(
        {
          userId: req.auth.userId,
          currentPassword: req.body.currentPassword,
          newPassword: req.body.newPassword,
          sessionId: req.auth.sessionId,
        },
        getRequestMeta(req)
      );
      return success(res, null, result.message);
    } catch (error) {
      return next(error);
    }
  },

  sendEmailVerification: async (req, res, next) => {
    try {
      const result = await emailVerificationService.sendVerificationEmail(
        req.auth.userId,
        getRequestMeta(req)
      );
      return success(res, null, result.message);
    } catch (error) {
      return next(error);
    }
  },

  verifyEmail: async (req, res, next) => {
    try {
      const result = await emailVerificationService.verifyEmail(
        { token: req.body.token },
        getRequestMeta(req)
      );
      return success(res, { alreadyVerified: result.alreadyVerified }, result.message);
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = authController;
