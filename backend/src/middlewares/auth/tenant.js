const { UnauthorizedError, ForbiddenError } = require('../../common/errors');
const { messages, roles } = require('../../constants');
const tenantPolicy = require('../../modules/auth/policies/tenant.policy');

const { ROLES } = roles;

const requireTenant =
  (options = {}) =>
  (req, _res, next) => {
    try {
      if (!req.auth) {
        throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED);
      }

      const allowedRoles = options.roles || [ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.SUPER_ADMIN];
      if (!allowedRoles.includes(req.auth.role)) {
        throw new ForbiddenError(messages.AUTH.FORBIDDEN, 'TENANT_ROLE_FORBIDDEN');
      }

      const requestedTenantId = tenantPolicy.resolveRequestedTenantId(req);
      const { tenantSchoolId, bypassed } = tenantPolicy.resolveTenantContext(
        req.auth,
        requestedTenantId
      );

      if (options.requireTenantId && !tenantSchoolId) {
        throw new ForbiddenError('Tenant identifier is required', 'TENANT_REQUIRED');
      }

      req.tenant = {
        schoolId: tenantSchoolId,
        bypassed,
        requestedSchoolId: requestedTenantId,
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };

const attachTenantFromAuth = (req, _res, next) => {
  if (!req.auth) {
    return next(new UnauthorizedError(messages.AUTH.UNAUTHORIZED));
  }

  req.tenant = {
    schoolId: req.auth.tenantSchoolId || null,
    bypassed: tenantPolicy.isSuperAdmin(req.auth),
    requestedSchoolId: tenantPolicy.resolveRequestedTenantId(req),
  };

  return next();
};

module.exports = {
  requireTenant,
  attachTenantFromAuth,
};
