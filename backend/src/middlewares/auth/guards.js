const { authenticate, optionalAuthenticate } = require('./authenticate');
const { authorizeRoles, requirePermissions, requireScopes } = require('./authorize');
const { requireTenant, attachTenantFromAuth } = require('./tenant');
const { requireEmailVerified } = require('./requireEmailVerified');

/**
 * Compose standard auth guards for protected business routes.
 *
 * @example
 * router.get('/orders', ...protectedRoute({ permissions: [PERMISSIONS.ORDERS_READ] }), handler);
 * router.get('/admin', ...protectedRoute({ roles: ['admin'], scopes: ['*'] }), handler);
 */
const protectedRoute = (options = {}) => {
  const guards = [authenticate];

  if (options.roles?.length) {
    guards.push(authorizeRoles(...options.roles));
  }

  if (options.permissions?.length) {
    guards.push(requirePermissions(options.permissions, options.permissionOptions));
  }

  if (options.scopes?.length) {
    guards.push(requireScopes(options.scopes, options.scopeOptions));
  }

  if (options.tenant) {
    guards.push(requireTenant(options.tenantOptions || options.tenant));
  }

  if (options.attachTenant) {
    guards.push(attachTenantFromAuth);
  }

  if (options.emailVerified) {
    guards.push(requireEmailVerified);
  }

  return guards;
};

const optionalAuthRoute = (options = {}) => {
  const guards = [optionalAuthenticate];

  if (options.attachTenant) {
    guards.push(attachTenantFromAuth);
  }

  return guards;
};

module.exports = {
  protectedRoute,
  optionalAuthRoute,
};
