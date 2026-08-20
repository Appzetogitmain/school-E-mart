const { ForbiddenError, NotFoundError } = require('../../../common/errors');
const tenantPolicy = require('../../auth/policies/tenant.policy');
const profileRepository = require('../../auth/repositories/profile.repository');
const { ROLES } = require('../../../constants/roles');

const orderAccessPolicy = {
  isPlatformAdmin(auth = {}) {
    return tenantPolicy.isSuperAdmin(auth);
  },

  resolveAudience(auth) {
    if (auth.role === ROLES.SCHOOL_ADMIN) return 'school';
    if (auth.role === ROLES.PARENT) return 'parent';
    return null;
  },

  async assertOrderAccess(auth, order) {
    if (this.isPlatformAdmin(auth)) return;

    if (auth.role === ROLES.PARENT) {
      if (String(order.userId) !== String(auth.userId)) {
        throw new ForbiddenError('You can only access your own orders', 'ORDER_ACCESS_DENIED');
      }
      return;
    }

    if (auth.role === ROLES.SCHOOL_ADMIN) {
      const isOwnUser = String(order.userId) === String(auth.userId);
      const isSchoolPickup =
        (order.schoolId && String(order.schoolId) === String(auth.schoolId)) ||
        (order.schoolIdForPickup && String(order.schoolIdForPickup) === String(auth.schoolId));
      if (!isOwnUser && !isSchoolPickup) {
        throw new ForbiddenError('You can only access orders for your school', 'ORDER_ACCESS_DENIED');
      }
      return;
    }

    if (auth.role === ROLES.VENDOR) {
      const vendor = await profileRepository.getVendorByUserId(auth.userId);
      if (!vendor) throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');
      const hasVendor = (order.vendorIds || []).some((id) => String(id) === String(vendor._id));
      if (!hasVendor) throw new ForbiddenError('You can only access your vendor orders', 'ORDER_ACCESS_DENIED');
      return;
    }

    throw new ForbiddenError('You do not have permission to access this order', 'ORDER_ACCESS_DENIED');
  },

  assertReturnAccess(auth, returnRequest) {
    if (this.isPlatformAdmin(auth)) return;
    if (String(returnRequest.userId) !== String(auth.userId)) {
      throw new ForbiddenError('You can only access your own returns', 'RETURN_ACCESS_DENIED');
    }
  },
};

module.exports = orderAccessPolicy;
