const { ForbiddenError } = require('../../common/errors');
const { messages } = require('../../constants');

const requireEmailVerified = (req, _res, next) => {
  if (!req.user) {
    return next(new ForbiddenError(messages.AUTH.UNAUTHORIZED, 'UNAUTHORIZED'));
  }

  if (!req.user.email) {
    return next(new ForbiddenError(messages.AUTH.EMAIL_NOT_VERIFIED, 'EMAIL_MISSING'));
  }

  if (!req.user.emailVerifiedAt) {
    return next(new ForbiddenError(messages.AUTH.EMAIL_NOT_VERIFIED, 'EMAIL_NOT_VERIFIED'));
  }

  return next();
};

module.exports = {
  requireEmailVerified,
};
