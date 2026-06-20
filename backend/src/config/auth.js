const env = require('./env');
const jwt = require('./jwt');

module.exports = Object.freeze({
  ...jwt,
  refreshCookieName: env.REFRESH_COOKIE_NAME,
  maxLoginAttempts: env.MAX_LOGIN_ATTEMPTS,
  lockoutMinutes: env.LOGIN_LOCKOUT_MINUTES,
});
