const { httpStatus } = require('../../constants');

class AppError extends Error {
  constructor(message, statusCode = httpStatus.INTERNAL_SERVER_ERROR, code = 'APP_ERROR', errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = null) {
    super(message, httpStatus.BAD_REQUEST, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, httpStatus.UNAUTHORIZED, code);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, httpStatus.FORBIDDEN, code);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, httpStatus.NOT_FOUND, code);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict', code = 'CONFLICT') {
    super(message, httpStatus.CONFLICT, code);
    this.name = 'ConflictError';
  }
}

class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests', code = 'RATE_LIMIT_EXCEEDED') {
    super(message, httpStatus.TOO_MANY_REQUESTS, code);
    this.name = 'TooManyRequestsError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
};
