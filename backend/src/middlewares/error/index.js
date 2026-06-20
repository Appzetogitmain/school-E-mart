const { AppError } = require('../../common/errors');
const { fail } = require('../../common/response');
const logger = require('../../common/logger');
const { httpStatus, messages, responseCodes } = require('../../constants');

const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return fail(res, err.message, err.statusCode, err.code, err.errors, req);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return fail(
      res,
      messages.AUTH.INVALID_TOKEN,
      httpStatus.UNAUTHORIZED,
      responseCodes.INVALID_TOKEN,
      null,
      req
    );
  }

  if (err.name === 'ValidationError' && err.errors) {
    return fail(
      res,
      err.message,
      httpStatus.BAD_REQUEST,
      responseCodes.MONGOOSE_VALIDATION_ERROR,
      err.errors,
      req
    );
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method,
    requestId: req.requestId,
  });

  return fail(
    res,
    messages.COMMON.INTERNAL_ERROR,
    httpStatus.INTERNAL_SERVER_ERROR,
    responseCodes.INTERNAL_ERROR,
    null,
    req
  );
};

const notFoundHandler = (req, res) =>
  fail(
    res,
    `Route ${req.method} ${req.originalUrl} not found`,
    httpStatus.NOT_FOUND,
    responseCodes.ROUTE_NOT_FOUND,
    null,
    req
  );

module.exports = {
  errorHandler,
  notFoundHandler,
};
