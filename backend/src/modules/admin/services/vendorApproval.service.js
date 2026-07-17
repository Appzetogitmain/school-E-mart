const verificationService = require('../../vendor/services/verification.service');
const registrationService = require('../../vendor/services/registration.service');
const vendorRepository = require('../../vendor/repositories/vendor.repository');
const reportRepository = require('../repositories/report.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const User = require('../../../database/models/User');
const { runAtomic } = require('../../orders/utils/atomic');
const { encryptAccountNumber } = require('../../vendor/utils/bank');
const { NotFoundError } = require('../../../common/errors');

const vendorApprovalService = {
  /**
   * Admin-created vendor. Reuses the public registration path (so uniqueness,
   * slug and password hashing stay in one place) and then approves immediately,
   * since an admin creating the account is itself the vetting step.
   */
  async createVendor(payload, actor = {}, requestMeta = {}) {
    const registered = await registrationService.register(payload, requestMeta);

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.created_by_admin',
      entityType: 'VendorProfile',
      entityId: registered.profile.id,
      after: { storeName: registered.profile.storeName },
    });

    if (payload.autoApprove !== false) {
      await verificationService.approveVendor(
        registered.profile.id,
        actor,
        'Created and approved by admin'
      );
    }

    return verificationService.getVendor(registered.profile.id);
  },

  /**
   * Admin edit of a vendor. Splits the payload across the User document (contact
   * details) and the VendorProfile (everything else).
   */
  async updateVendor(vendorId, payload, actor = {}) {
    const vendor = await vendorRepository.findById(vendorId);
    if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');

    // Same guard as the vendor-facing path: an admin must not be able to move an
    // email or phone onto a vendor when another account already holds it.
    await registrationService.assertContactAvailable({
      email: payload.email,
      phone: payload.phone,
      exceptUserId: vendor.userId,
    });

    const profileUpdate = {};
    if (payload.storeName !== undefined) {
      profileUpdate.storeName = payload.storeName;
      if (payload.storeName !== vendor.storeName) {
        profileUpdate.storeSlug = await registrationService.ensureUniqueStoreSlug(
          payload.storeName,
          vendorId
        );
      }
    }
    if (payload.commissionPercent !== undefined) profileUpdate.commissionPercent = payload.commissionPercent;
    if (payload.serviceRadiusKm !== undefined) profileUpdate.serviceRadiusKm = payload.serviceRadiusKm;
    if (payload.gstin !== undefined) profileUpdate.gstin = payload.gstin;
    if (payload.panCard !== undefined) profileUpdate.panCard = payload.panCard;
    if (payload.categories !== undefined) profileUpdate.categories = payload.categories;

    if (payload.address) {
      profileUpdate.address = { ...vendor.address, ...payload.address };
    }
    // API speaks latitude/longitude; the model stores GeoJSON [lng, lat].
    if (payload.latitude !== undefined && payload.longitude !== undefined) {
      profileUpdate.location = {
        type: 'Point',
        coordinates: [payload.longitude, payload.latitude],
      };
    }

    if (payload.bank) {
      const bank = { ...(vendor.bank || {}) };
      if (payload.bank.accountName !== undefined) bank.accountName = payload.bank.accountName;
      if (payload.bank.bankName !== undefined) bank.bankName = payload.bank.bankName;
      if (payload.bank.branch !== undefined) bank.branch = payload.bank.branch;
      if (payload.bank.ifsc !== undefined) bank.ifsc = payload.bank.ifsc;
      // Account numbers are stored as a one-way HMAC and can never be read back,
      // so only overwrite when a new number is actually supplied.
      if (payload.bank.accountNumber) {
        bank.accountNumberEnc = encryptAccountNumber(payload.bank.accountNumber);
      }
      profileUpdate.bank = bank;
    }

    const userUpdate = {};
    if (payload.name !== undefined) userUpdate.name = payload.name;
    if (payload.email !== undefined) userUpdate.email = payload.email;
    if (payload.phone !== undefined) userUpdate.phone = payload.phone;

    if (Object.keys(profileUpdate).length) {
      await vendorRepository.updateById(vendorId, { $set: profileUpdate });
    }
    if (Object.keys(userUpdate).length) {
      await User.findByIdAndUpdate(vendor.userId, { $set: userUpdate });
    }

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'vendor.updated_by_admin',
      entityType: 'VendorProfile',
      entityId: vendorId,
      after: { fields: [...Object.keys(profileUpdate), ...Object.keys(userUpdate)] },
    });

    return verificationService.getVendor(vendorId);
  },

  /**
   * Soft-deletes the vendor and deactivates the login, so the account cannot be
   * used after removal.
   */
  async deleteVendor(vendorId, actor = {}) {
    return runAtomic(async () => {
      const vendor = await vendorRepository.findById(vendorId);
      if (!vendor) throw new NotFoundError('Vendor not found', 'VENDOR_NOT_FOUND');

      await vendorRepository.softDeleteById(vendorId, { deletedBy: actor.userId });
      await User.findByIdAndUpdate(vendor.userId, { $set: { status: 'inactive' } });

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'vendor.deleted_by_admin',
        entityType: 'VendorProfile',
        entityId: vendorId,
        after: { storeName: vendor.storeName },
      });

      return { id: vendorId };
    });
  },

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
