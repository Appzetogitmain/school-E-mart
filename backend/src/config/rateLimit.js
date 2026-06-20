const env = require('./env');

module.exports = Object.freeze({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  authMax: env.AUTH_RATE_LIMIT_MAX,
  otpMax: env.OTP_MAX_PER_WINDOW,
  otpWindowMs: env.OTP_WINDOW_MS,
});
