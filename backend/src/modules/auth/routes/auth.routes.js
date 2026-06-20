const express = require('express');
const authController = require('../controllers/auth.controller');
const authValidators = require('../validators/auth.validator');
const { validateBody } = require('../../../middlewares/validation');
const { authenticate } = require('../../../middlewares/auth/authenticate');
const { authLimiter } = require('../../../middlewares/rateLimit');
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

module.exports = router;
