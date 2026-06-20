const { UnauthorizedError, ForbiddenError } = require('../../common/errors');
const { messages } = require('../../constants');
const rbacPolicy = require('../../modules/auth/policies/rbac.policy');

const authorizeRoles =
  (...allowedRoles) =>
  (req, _res, next) => {
    if (!req.auth) {
      return next(new UnauthorizedError(messages.AUTH.UNAUTHORIZED));
    }

    if (!rbacPolicy.hasRole(req.auth.role, allowedRoles)) {
      return next(new ForbiddenError(messages.AUTH.FORBIDDEN, 'ROLE_FORBIDDEN'));
    }

    return next();
  };

const requirePermissions =
  (requiredPermissions = [], options = {}) =>
  (req, _res, next) => {
    if (!req.auth) {
      return next(new UnauthorizedError(messages.AUTH.UNAUTHORIZED));
    }

    const mode = options.mode || 'all';
    const granted = req.auth.permissions || [];
    const allowed =
      mode === 'any'
        ? rbacPolicy.hasAnyPermission(granted, requiredPermissions)
        : rbacPolicy.hasAllPermissions(granted, requiredPermissions);

    if (!allowed) {
      return next(new ForbiddenError(messages.AUTH.FORBIDDEN, 'PERMISSION_DENIED'));
    }

    return next();
  };

const requireScopes =
  (requiredScopes = [], options = {}) =>
  (req, _res, next) => {
    if (!req.auth) {
      return next(new UnauthorizedError(messages.AUTH.UNAUTHORIZED));
    }

    const mode = options.mode || 'all';
    const granted = req.auth.scopes || [];
    const allowed =
      mode === 'any'
        ? rbacPolicy.hasAnyScope(granted, requiredScopes)
        : rbacPolicy.hasAllScopes(granted, requiredScopes);

    if (!allowed) {
      return next(new ForbiddenError(messages.AUTH.FORBIDDEN, 'SCOPE_DENIED'));
    }

    return next();
  };

const requireSuperAdmin = authorizeRoles('admin');

module.exports = {
  authorizeRoles,
  requirePermissions,
  requireScopes,
  requireSuperAdmin,
};
