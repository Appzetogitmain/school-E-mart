const env = require('./env');

module.exports = {
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  authMax: env.AUTH_RATE_LIMIT_MAX,
};
