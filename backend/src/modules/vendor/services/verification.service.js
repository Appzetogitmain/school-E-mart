const { NotFoundError, BadRequestError } = require('../../../common/errors');
const User = require('../../../database/models/User');
const vendorRepository = require('../repositories/vendor.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const { mapVendorDisplayStatus } = require('../utils/status');

const verificationService = {
  listVendors(query) {
    const filter = {};
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
    if (query.search) {
      filter.$or = [
        { storeName: { $regex: query.search, $options: 'i' } },
        { storeSlug: { $regex: query.search, $options: 'i' } },
      ];
    }
    return vendorRepository.listWithUsers(filter, query);
  },

  async getVendor(vendorId) {
    const vendor = await vendorRepository.findWithUser(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');
    return {
      ...vendor,
      status: mapVendorDisplayStatus(vendor, vendor.user),
    };
  },

  async approveVendor(vendorId, actor = {}, note) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');
    if (vendor.approvalStatus === 'approved') {
      throw new BadRequestError('Vendor is already approved', null, 'VENDOR_ALREADY_APPROVED');
    }

    const updated = await vendorRepository.updateById(vendorId, {
      $set: { approvalStatus: 'approved', verifiedBadge: true },
    });

    await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'active' } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.approved',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { note },
    });

    return updated;
  },

  async rejectVendor(vendorId, actor = {}, reason) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');

    const updated = await vendorRepository.updateById(vendorId, {
      $set: { approvalStatus: 'suspended', verifiedBadge: false },
    });

    await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'inactive' } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.rejected',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { reason },
    });

    return updated;
  },

  async suspendVendor(vendorId, actor = {}, reason) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');

    const updated = await vendorRepository.updateById(vendorId, {
      $set: { approvalStatus: 'suspended', verifiedBadge: false },
    });

    await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'suspended' } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.suspended',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { reason },
    });

    return updated;
  },

  async requestReVerification(vendorId, actor = {}, note) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');

    const updated = await vendorRepository.updateById(vendorId, {
      $set: { approvalStatus: 'pending', verifiedBadge: false },
    });

    await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'active' } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.reverify',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { note },
    });

    return updated;
  },
};

module.exports = verificationService;
