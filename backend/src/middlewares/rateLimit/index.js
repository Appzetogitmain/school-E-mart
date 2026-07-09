const rateLimit = require('express-rate-limit');
const config = require('../../config');
const { httpStatus, messages, responseCodes } = require('../../constants');
const { fail } = require('../../common/response');

const createRateLimiter = ({
  windowMs = config.rateLimit.windowMs,
  max = config.rateLimit.max,
  message = messages.COMMON.INTERNAL_ERROR,
  keyGenerator,
  skipSuccessfulRequests = false,
} = {}) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skipSuccessfulRequests,
    handler: (req, res) =>
      fail(res, message, httpStatus.TOO_MANY_REQUESTS, responseCodes.RATE_LIMIT_EXCEEDED, null, req),
  });

// Only failed attempts count toward the limit, so legitimate logins and
// token refreshes from a shared IP (school NAT) are never blocked.
const authLimiter = createRateLimiter({
  max: config.rateLimit.authMax,
  message: 'Too many authentication attempts. Please try again later.',
  skipSuccessfulRequests: true,
});

const otpLimiter = createRateLimiter({
  windowMs: config.rateLimit.otpWindowMs,
  max: config.rateLimit.otpMax,
  message: 'Too many OTP requests. Please try again later.',
});

module.exports = {
  createRateLimiter,
  authLimiter,
  otpLimiter,
};
