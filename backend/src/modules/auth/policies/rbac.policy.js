const { PERMISSIONS } = require('../../../constants/permissions');

const WILDCARD_PERMISSIONS = new Set([PERMISSIONS.PLATFORM_ADMIN, '*']);

const hasWildcardPermission = (permissions = []) =>
  permissions.some((permission) => WILDCARD_PERMISSIONS.has(permission));

const hasWildcardScope = (scopes = []) => scopes.includes('*');

const hasPermission = (grantedPermissions = [], requiredPermission) => {
  if (hasWildcardPermission(grantedPermissions)) return true;
  return grantedPermissions.includes(requiredPermission);
};

const hasAllPermissions = (grantedPermissions = [], requiredPermissions = []) => {
  if (!requiredPermissions.length) return true;
  if (hasWildcardPermission(grantedPermissions)) return true;
  return requiredPermissions.every((permission) =>
    grantedPermissions.includes(permission)
  );
};

const hasAnyPermission = (grantedPermissions = [], requiredPermissions = []) => {
  if (!requiredPermissions.length) return true;
  if (hasWildcardPermission(grantedPermissions)) return true;
  return requiredPermissions.some((permission) =>
    grantedPermissions.includes(permission)
  );
};

const hasScope = (grantedScopes = [], requiredScope) => {
  if (hasWildcardScope(grantedScopes)) return true;
  return grantedScopes.includes(requiredScope);
};

const hasAllScopes = (grantedScopes = [], requiredScopes = []) => {
  if (!requiredScopes.length) return true;
  if (hasWildcardScope(grantedScopes)) return true;
  return requiredScopes.every((scope) => grantedScopes.includes(scope));
};

const hasAnyScope = (grantedScopes = [], requiredScopes = []) => {
  if (!requiredScopes.length) return true;
  if (hasWildcardScope(grantedScopes)) return true;
  return requiredScopes.some((scope) => grantedScopes.includes(scope));
};

const normalizeRole = (role) => (typeof role === 'string' ? role.trim().toLowerCase() : role);

const hasRole = (userRole, allowedRoles = []) => {
  if (!Array.isArray(allowedRoles) || !allowedRoles.length) return false;
  const normalizedUserRole = normalizeRole(userRole);
  return allowedRoles.map(normalizeRole).includes(normalizedUserRole);
};

module.exports = {
  hasWildcardPermission,
  hasWildcardScope,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  hasScope,
  hasAllScopes,
  hasAnyScope,
  hasRole,
};
