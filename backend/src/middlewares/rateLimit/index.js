const rateLimit = require('express-rate-limit');
const env = require('../../config/env');
const { httpStatus, messages, responseCodes } = require('../../constants');
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
    handler: (req, res) =>
      fail(res, message, httpStatus.TOO_MANY_REQUESTS, responseCodes.RATE_LIMIT_EXCEEDED, null, req),
  });

const globalLimiter = createRateLimiter();

const authLimiter = createRateLimiter({
  max: env.AUTH_RATE_LIMIT_MAX,
  message: 'Too many authentication attempts. Please try again later.',
});

const otpLimiter = createRateLimiter({
  windowMs: env.OTP_WINDOW_MS,
  max: env.OTP_MAX_PER_WINDOW,
  message: 'Too many OTP requests. Please try again later.',
});

module.exports = {
  createRateLimiter,
  globalLimiter,
  authLimiter,
  otpLimiter,
};
