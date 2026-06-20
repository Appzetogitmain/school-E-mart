const { UnauthorizedError } = require('../../../common/errors');
const { messages } = require('../../../constants');
const userRepository = require('../repositories/user.repository');
const { resolveAuthorizationContext } = require('./sessionIssue.service');
const tenantPolicy = require('../policies/tenant.policy');

const authorizationService = {
  async getAuthorizationSnapshot(userId) {
    const user = await userRepository.findActiveById(userId);
    if (!user) {
      throw new UnauthorizedError(messages.AUTH.UNAUTHORIZED);
    }

    const authContext = await resolveAuthorizationContext(user);

    return {
      userId: user._id.toString(),
      role: user.role,
      refId: user.refId,
      tenantSchoolId: user.tenantSchoolId?.toString() || null,
      permissions: authContext.permissions,
      scopes: authContext.scopes,
      roleScopes: user.roleScopes || [],
      profile: authContext.profile || null,
      isSuperAdmin: tenantPolicy.isSuperAdmin({
        role: user.role,
        scopes: authContext.scopes,
      }),
      requiresTenantBinding: tenantPolicy.requiresTenantBinding(user.role),
    };
  },
};

module.exports = authorizationService;
