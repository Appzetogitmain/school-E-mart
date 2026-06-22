const { authenticate, optionalAuthenticate, extractBearerToken } = require('./authenticate');
const {
  authorizeRoles,
  requirePermissions,
  requireScopes,
  requireSuperAdmin,
} = require('./authorize');
const { requireTenant, attachTenantFromAuth } = require('./tenant');
const { requireEmailVerified } = require('./requireEmailVerified');
const { protectedRoute, optionalAuthRoute } = require('./guards');

module.exports = {
  authenticate,
  optionalAuthenticate,
  extractBearerToken,
  authorizeRoles,
  requirePermissions,
  requireScopes,
  requireSuperAdmin,
  requireTenant,
  attachTenantFromAuth,
  requireEmailVerified,
  protectedRoute,
  optionalAuthRoute,
};
