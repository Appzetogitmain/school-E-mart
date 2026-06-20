const { ForbiddenError } = require('../../../common/errors');
const { roles } = require('../../../constants');
const rbacPolicy = require('./rbac.policy');

const { ROLES } = roles;

const TENANT_BOUND_ROLES = new Set([ROLES.SCHOOL_ADMIN, ROLES.TEACHER]);
const TENANT_KEYS = ['schoolId', 'tenantSchoolId'];

const extractTenantIdFromSource = (source = {}) => {
  for (const key of TENANT_KEYS) {
    if (source[key]) {
      return String(source[key]);
    }
  }
  return null;
};

const resolveRequestedTenantId = (req) =>
  extractTenantIdFromSource(req.params) ||
  extractTenantIdFromSource(req.query) ||
  extractTenantIdFromSource(req.body) ||
  (req.headers['x-tenant-school-id']
    ? String(req.headers['x-tenant-school-id'])
    : null);

const isSuperAdmin = (auth = {}) =>
  auth.role === ROLES.SUPER_ADMIN && rbacPolicy.hasWildcardScope(auth.scopes || []);

const resolveTenantContext = (auth = {}, requestedTenantId = null) => {
  if (isSuperAdmin(auth)) {
    return {
      tenantSchoolId: requestedTenantId || auth.tenantSchoolId || null,
      bypassed: true,
    };
  }

  if (!TENANT_BOUND_ROLES.has(auth.role)) {
    return {
      tenantSchoolId: null,
      bypassed: false,
    };
  }

  if (!auth.tenantSchoolId) {
    throw new ForbiddenError('Tenant context is not assigned to this account', 'TENANT_MISSING');
  }

  if (requestedTenantId && requestedTenantId !== auth.tenantSchoolId) {
    throw new ForbiddenError(
      'Cross-tenant access is not allowed',
      'TENANT_FORBIDDEN'
    );
  }

  return {
    tenantSchoolId: auth.tenantSchoolId,
    bypassed: false,
  };
};

const assertTenantAccess = (auth, requestedTenantId = null) => {
  const context = resolveTenantContext(auth, requestedTenantId);
  return context.tenantSchoolId;
};

const requiresTenantBinding = (role) => TENANT_BOUND_ROLES.has(role);

module.exports = {
  TENANT_BOUND_ROLES,
  TENANT_KEYS,
  resolveRequestedTenantId,
  isSuperAdmin,
  resolveTenantContext,
  assertTenantAccess,
  requiresTenantBinding,
};
