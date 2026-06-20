const rateLimit = require('express-rate-limit');
const env = require('../../config/env');
const { httpStatus, messages } = require('../../constants');
const { fail } = require('../../common/response');

const createRateLimiter = ({
  windowMs = env.RATE_LIMIT_WINDOW_MS,
  max = env.RATE_LIMIT_MAX,
  message = messages.COMMON.INTERNAL_ERROR,
  keyGenerator,
} = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    handler: (_req, res) =>
      fail(res, message, httpStatus.TOO_MANY_REQUESTS, 'RATE_LIMIT_EXCEEDED'),
  });

const globalLimiter = createRateLimiter();

const authLimiter = createRateLimiter({
  max: env.AUTH_RATE_LIMIT_MAX,
  message: 'Too many authentication attempts. Please try again later.',
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter,
};
