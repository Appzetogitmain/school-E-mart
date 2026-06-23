const verificationService = require('../../vendor/services/verification.service');
const vendorRepository = require('../../vendor/repositories/vendor.repository');
const reportRepository = require('../repositories/report.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const User = require('../../../database/models/User');
const { runAtomic } = require('../../orders/utils/atomic');

const vendorApprovalService = {
  listPendingVendors(query) {
    return verificationService.listVendors({ ...query, approvalStatus: 'pending' });
  },

  listVendors(query) {
    return verificationService.listVendors(query);
  },

  getVendor(vendorId) {
    return verificationService.getVendor(vendorId);
  },

  approveVendor(vendorId, actor, note) {
    return verificationService.approveVendor(vendorId, actor, note);
  },

  rejectVendor(vendorId, actor, reason) {
    return verificationService.rejectVendor(vendorId, actor, reason);
  },

  suspendVendor(vendorId, actor, reason) {
    return verificationService.suspendVendor(vendorId, actor, reason);
  },

  async reactivateVendor(vendorId, actor = {}, note) {
    return runAtomic(async () => {
      const vendor = await vendorRepository.findById(vendorId);
      if (!vendor) {
        const { NotFoundError } = require('../../../common/errors');
        throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');
      }

      const updated = await vendorRepository.updateById(vendorId, {
        $set: { approvalStatus: 'approved', verifiedBadge: true },
      });

      await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'active' } });

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'vendor.reactivated',
        entityType: 'VendorProfile',
        entityId: vendorId,
        after: { note },
      });

      return updated;
    });
  },

  getApprovalHistory(vendorId, query = {}) {
    return reportRepository.paginateAuditLogs(
      {
        entityType: 'VendorProfile',
        entityId: vendorId,
        action: {
          $in: [
            'vendor.approved',
            'vendor.rejected',
            'vendor.suspended',
            'vendor.reactivated',
            'vendor.reverify',
          ],
        },
      },
      query
    );
  },
};

module.exports = vendorApprovalService;
