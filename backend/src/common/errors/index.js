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
  constructor(message = 'Validation failed', errors = null) {
    super(message, httpStatus.BAD_REQUEST, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', errors = null, code = 'BAD_REQUEST') {
    super(message, httpStatus.BAD_REQUEST, code, errors);
    this.name = 'BadRequestError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required', code = 'UNAUTHORIZED') {
    super(message, httpStatus.UNAUTHORIZED, code);
    this.name = 'UnauthorizedError';
  }
}

class AuthenticationError extends UnauthorizedError {
  constructor(message = 'Authentication required', code = 'AUTHENTICATION_ERROR') {
    super(message, code);
    this.name = 'AuthenticationError';
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code = 'FORBIDDEN') {
    super(message, httpStatus.FORBIDDEN, code);
    this.name = 'ForbiddenError';
  }
}

class AuthorizationError extends ForbiddenError {
  constructor(message = 'Forbidden', code = 'AUTHORIZATION_ERROR') {
    super(message, code);
    this.name = 'AuthorizationError';
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

class InternalServerError extends AppError {
  constructor(message = 'An unexpected error occurred', code = 'INTERNAL_ERROR') {
    super(message, httpStatus.INTERNAL_SERVER_ERROR, code);
    this.name = 'InternalServerError';
  }
}

module.exports = {
  AppError,
  ValidationError,
  BadRequestError,
  UnauthorizedError,
  AuthenticationError,
  ForbiddenError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
};
