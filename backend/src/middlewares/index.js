const requestId = require('./requestId');
const requestLogger = require('./requestLogger');
const asyncHandler = require('./asyncHandler');
const { errorHandler, notFoundHandler } = require('./error');
const { validateBody, validateParams, validateQuery, validateHeaders } = require('./validation');
const { globalLimiter, authLimiter, otpLimiter, createRateLimiter } = require('./rateLimit');
const authMiddleware = require('./auth');
const { requireIdempotencyKey } = require('./idempotency');

module.exports = {
  requestId,
  requestLogger,
  asyncHandler,
  errorHandler,
  notFoundHandler,
  validateBody,
  validateParams,
  validateQuery,
  validateHeaders,
  globalLimiter,
  authLimiter,
  otpLimiter,
  createRateLimiter,
  auth: authMiddleware,
  requireIdempotencyKey,
};
