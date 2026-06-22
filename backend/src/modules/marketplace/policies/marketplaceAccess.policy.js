const VendorProfile = require('../../../database/models/VendorProfile');
const { ForbiddenError, NotFoundError } = require('../../../common/errors');
const tenantPolicy = require('../../auth/policies/tenant.policy');
const { ROLES } = require('../../../constants/roles');

const marketplaceAccessPolicy = {
  isCatalogAdmin(auth = {}) {
    return tenantPolicy.isSuperAdmin(auth);
  },

  async resolveVendorId(auth) {
    if (this.isCatalogAdmin(auth)) return null;
    if (auth.role !== ROLES.VENDOR) {
      throw new ForbiddenError('Vendor access required', 'VENDOR_ACCESS_REQUIRED');
    }
    const vendor = await VendorProfile.findOne({
      userId: auth.userId,
      approvalStatus: 'approved',
      'softDelete.isDeleted': { $ne: true },
    }).lean();
    if (!vendor) {
      throw new ForbiddenError('Approved vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');
    }
    return vendor._id;
  },

  async assertProductOwnership(auth, product) {
    if (this.isCatalogAdmin(auth)) return;
    const vendorId = await this.resolveVendorId(auth);
    if (!vendorId || String(product.vendorId) !== String(vendorId)) {
      throw new ForbiddenError('You can only manage your own products', 'PRODUCT_ACCESS_DENIED');
    }
  },

  assertCartAudience(auth, audience) {
    const roleAudienceMap = {
      [ROLES.PARENT]: 'parent',
      [ROLES.SCHOOL_ADMIN]: 'school',
    };
    const expected = roleAudienceMap[auth.role];
    if (expected && audience !== expected) {
      throw new ForbiddenError('Invalid cart audience for your role', 'CART_AUDIENCE_FORBIDDEN');
    }
  },

  resolveAudience(auth, requestedAudience = 'parent') {
    if (auth.role === ROLES.SCHOOL_ADMIN) return 'school';
    if (auth.role === ROLES.PARENT) return 'parent';
    return requestedAudience;
  },
};

module.exports = marketplaceAccessPolicy;
