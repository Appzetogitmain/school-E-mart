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

// Keyed per IP (express-rate-limit's default), so this is a shared budget for
// everyone behind one address — a school or office NAT, or a whole test session.
// It therefore uses its own generous ceiling rather than the per-phone cap; the
// real per-number protection lives in otp.service.
//
// The wording differs from the service's message on purpose. Both used to read
// "Too many OTP requests. Please try again later.", so there was no way to tell
// which limit had tripped, and the IP one looked like a per-user limit.
const otpLimiter = createRateLimiter({
  windowMs: config.rateLimit.otpWindowMs,
  max: config.rateLimit.otpIpMax,
  message: 'Too many OTP requests from this network. Please try again later.',
});

module.exports = {
  createRateLimiter,
  authLimiter,
  otpLimiter,
};
