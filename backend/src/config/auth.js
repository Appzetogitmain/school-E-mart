const env = require('./env');

module.exports = {
  accessSecret: env.JWT_ACCESS_SECRET,
  refreshSecret: env.JWT_REFRESH_SECRET,
  accessExpiry: env.JWT_ACCESS_EXPIRY,
  refreshExpiry: env.JWT_REFRESH_EXPIRY,
  accessExpiryMs: env.JWT_ACCESS_EXPIRY_MS,
  refreshExpiryMs: env.JWT_REFRESH_EXPIRY_MS,
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
  refreshCookieName: env.REFRESH_COOKIE_NAME,
  maxLoginAttempts: env.MAX_LOGIN_ATTEMPTS,
  lockoutMinutes: env.LOGIN_LOCKOUT_MINUTES,
};
