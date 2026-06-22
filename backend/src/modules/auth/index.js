const createModule = require('../../common/routing/createModule');
const authRoutes = require('./routes/auth.routes');
const authService = require('./services/auth.service');
const otpService = require('./services/otp.service');
const passwordService = require('./services/password.service');
const emailVerificationService = require('./services/emailVerification.service');
const sessionService = require('./services/session.service');
const authorizationService = require('./services/authorization.service');
const policies = require('./policies');
const authMiddleware = require('../../middlewares/auth');

const authModule = createModule({
  name: 'auth',
  mountPath: '/auth',
  routes: authRoutes,
});

module.exports = {
  authModule,
  authRoutes,
  authService,
  otpService,
  passwordService,
  emailVerificationService,
  sessionService,
  authorizationService,
  policies,
  authMiddleware,
};
