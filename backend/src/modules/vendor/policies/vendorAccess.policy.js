const VendorProfile = require('../../../database/models/VendorProfile');
const User = require('../../../database/models/User');
const { ForbiddenError, NotFoundError } = require('../../../common/errors');
const tenantPolicy = require('../../auth/policies/tenant.policy');
const { ROLES } = require('../../../constants/roles');

const vendorAccessPolicy = {
  isPlatformAdmin(auth = {}) {
    return tenantPolicy.isSuperAdmin(auth);
  },

  canManageVendors(auth = {}) {
    return this.isPlatformAdmin(auth);
  },

  async resolveVendorProfile(auth) {
    if (auth.role !== ROLES.VENDOR) {
      throw new ForbiddenError('Vendor access required', 'VENDOR_ACCESS_REQUIRED');
    }
    let vendor = await VendorProfile.findOne({
      userId: auth.userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();

    if (!vendor) {
      const user = await User.findById(auth.userId).lean();
      if (user) {
        const storeSlug = (user.name || 'vendor').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + user._id.toString().slice(-4);
        const newProfile = await VendorProfile.create({
          userId: user._id,
          storeName: user.name || 'Vendor Store',
          storeSlug,
          commissionPercent: 10,
          approvalStatus: 'approved',
          serviceRadiusKm: 10,
          categories: [],
        });
        vendor = newProfile.toObject ? newProfile.toObject() : newProfile;
      }
    }

    if (!vendor) {
      throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');
    }
    if (vendor.approvalStatus === 'suspended') {
      throw new ForbiddenError('Vendor account is suspended', 'VENDOR_SUSPENDED');
    }
    return vendor;
  },

  async resolveApprovedVendorId(auth) {
    const vendor = await this.resolveVendorProfile(auth);
    if (vendor.approvalStatus === 'suspended') {
      throw new ForbiddenError('Vendor account is suspended', 'VENDOR_SUSPENDED');
    }
    return vendor._id;
  },

  async resolveVendorIdForAdmin(auth, requestedVendorId = null) {
    if (this.isPlatformAdmin(auth)) {
      return requestedVendorId;
    }
    return this.resolveApprovedVendorId(auth);
  },

  assertProductOwnership(vendorId, product) {
    if (!vendorId || String(product.vendorId) !== String(vendorId)) {
      throw new ForbiddenError('You can only manage your own products', 'PRODUCT_ACCESS_DENIED');
    }
  },

  assertOrderOwnership(vendorId, order) {
    const hasVendor = (order.vendorIds || []).some((id) => String(id) === String(vendorId));
    if (!hasVendor) {
      throw new ForbiddenError('You can only access your own orders', 'ORDER_ACCESS_DENIED');
    }
  },

  assertReturnOwnership(vendorId, returnRequest) {
    if (String(returnRequest.vendorId) !== String(vendorId)) {
      throw new ForbiddenError('You can only access your own returns', 'RETURN_ACCESS_DENIED');
    }
  },
};

module.exports = vendorAccessPolicy;
