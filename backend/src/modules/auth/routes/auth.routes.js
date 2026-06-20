const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidators = require('../validators/auth.validator');
const { validateBody, validateParams } = require('../../../middlewares/validation');
const { authenticate } = require('../../../middlewares/auth/authenticate');
const { authLimiter, otpLimiter } = require('../../../middlewares/rateLimit');
const { ROLES } = require('../../../constants/roles');

const router = express.Router();

router.post(
  '/login',
  authLimiter,
  validateBody(authValidators.loginSchema),
  authController.login()
);

router.post(
  '/school/admin/login',
  authLimiter,
  validateBody(authValidators.schoolAdminLoginSchema),
  authController.login(ROLES.SCHOOL_ADMIN)
);

router.post(
  '/school/teacher/login',
  authLimiter,
  validateBody(authValidators.teacherLoginSchema),
  authController.login(ROLES.TEACHER)
);

router.post(
  '/vendor/login',
  authLimiter,
  validateBody(authValidators.vendorLoginSchema),
  authController.login(ROLES.VENDOR)
);

router.post(
  '/admin/login',
  authLimiter,
  validateBody(authValidators.superAdminLoginSchema),
  authController.login(ROLES.SUPER_ADMIN)
);

router.post(
  '/refresh',
  authLimiter,
  validateBody(authValidators.refreshSchema),
  authController.refresh
);

router.post(
  '/logout',
  authenticate,
  validateBody(authValidators.logoutSchema),
  authController.logout
);

router.get('/me', authenticate, authController.me);

router.post(
  '/parent/otp/request',
  otpLimiter,
  validateBody(authValidators.parentOtpRequestSchema),
  authController.requestParentOtp('login_parent')
);

router.post(
  '/parent/otp/verify',
  otpLimiter,
  validateBody(authValidators.parentOtpVerifySchema),
  authController.verifyParentOtp
);

router.post(
  '/parent/web/login',
  otpLimiter,
  validateBody(authValidators.parentWebLoginSchema),
  authController.parentWebLogin
);

router.post(
  '/parent/web/register/otp/request',
  otpLimiter,
  validateBody(authValidators.parentWebRegisterOtpSchema),
  authController.requestParentOtp('web_register')
);

router.post(
  '/parent/web/register/otp/verify',
  otpLimiter,
  validateBody(authValidators.parentWebRegisterVerifySchema),
  authController.verifyWebRegisterOtp
);

router.post(
  '/forgot-password',
  authLimiter,
  validateBody(authValidators.forgotPasswordSchema),
  authController.forgotPassword
);

router.post(
  '/reset-password',
  authLimiter,
  validateBody(authValidators.resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/change-password',
  authenticate,
  authLimiter,
  validateBody(authValidators.changePasswordSchema),
  authController.changePassword
);

router.post(
  '/email/verify/request',
  authenticate,
  authLimiter,
  validateBody(authValidators.emailVerifyRequestSchema),
  authController.sendEmailVerification
);

router.post(
  '/email/verify',
  authLimiter,
  validateBody(authValidators.emailVerifySchema),
  authController.verifyEmail
);

router.get('/permissions', authenticate, authController.getAuthorization);

router.get('/sessions', authenticate, authController.listSessions);

router.delete(
  '/sessions/:sessionId',
  authenticate,
  validateParams(authValidators.sessionIdParamSchema),
  authController.revokeSession
);

router.post('/sessions/revoke-others', authenticate, authController.revokeOtherSessions);

module.exports = router;
