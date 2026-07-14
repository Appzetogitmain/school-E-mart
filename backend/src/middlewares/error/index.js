const { AppError } = require('../../common/errors');
const { fail } = require('../../common/response');
const logger = require('../../common/logger');
const { httpStatus, messages, responseCodes } = require('../../constants');

const errorHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    return fail(res, err.message, err.statusCode, err.code, err.errors, req);
  }

  // body-parser failures. Without these they fall through to the catch-all below and are
  // reported as a 500, which tells a parent uploading an oversized homework file that the
  // server broke rather than that their file is too big.
  if (err.type === 'entity.too.large') {
    return fail(
      res,
      'The uploaded content is too large',
      httpStatus.PAYLOAD_TOO_LARGE,
      responseCodes.PAYLOAD_TOO_LARGE,
      null,
      req
    );
  }

  if (err.type === 'entity.parse.failed') {
    return fail(
      res,
      'Malformed JSON in request body',
      httpStatus.BAD_REQUEST,
      responseCodes.MALFORMED_JSON,
      null,
      req
    );
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

  if (err.name === 'CastError') {
    return fail(
      res,
      `Invalid ${err.path || 'identifier'}`,
      httpStatus.BAD_REQUEST,
      responseCodes.INVALID_OBJECT_ID,
      null,
      req
    );
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return fail(
      res,
      `Duplicate value for ${field}`,
      httpStatus.CONFLICT,
      responseCodes.DUPLICATE_KEY,
      null,
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
