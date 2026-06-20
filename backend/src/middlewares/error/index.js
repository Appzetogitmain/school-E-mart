const { AppError } = require('../../common/errors');
const { fail } = require('../../common/response');
const logger = require('../../common/logger');
const { httpStatus, messages } = require('../../constants');

const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return fail(res, err.message, err.statusCode, err.code, err.errors);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return fail(
      res,
      messages.AUTH.INVALID_TOKEN,
      httpStatus.UNAUTHORIZED,
      'INVALID_TOKEN'
    );
  }

  if (err.name === 'ValidationError' && err.errors) {
    return fail(res, err.message, httpStatus.BAD_REQUEST, 'MONGOOSE_VALIDATION_ERROR', err.errors);
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
  });

  return fail(
    res,
    messages.COMMON.INTERNAL_ERROR,
    httpStatus.INTERNAL_SERVER_ERROR,
    'INTERNAL_ERROR'
  );
};

const notFoundHandler = (req, res) =>
  fail(res, `Route ${req.method} ${req.originalUrl} not found`, httpStatus.NOT_FOUND, 'ROUTE_NOT_FOUND');

module.exports = {
  errorHandler,
  notFoundHandler,
};
