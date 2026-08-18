const { NotFoundError } = require('../../../common/errors');
const User = require('../../../database/models/User');
const vendorRepository = require('../repositories/vendor.repository');
const { uniqueSlug } = require('../../marketplace/utils/slug');
const VendorProfile = require('../../../database/models/VendorProfile');
const { encryptAccountNumber, maskAccountNumber } = require('../utils/bank');
const { mapVendorDisplayStatus } = require('../utils/status');
const registrationService = require('./registration.service');

const sanitizeProfile = (profile, user) => {
  const bank = profile.bank
    ? {
        accountName: profile.bank.accountName,
        bankName: profile.bank.bankName,
        branch: profile.bank.branch,
        ifsc: profile.bank.ifsc,
        accountNumber: profile.bank.accountNumber || profile.bank.accountNumberMasked || '',
        accountNumberMasked: profile.bank.accountNumber || profile.bank.accountNumberMasked || (profile.bank.accountNumberEnc ? '' : undefined),
      }
    : undefined;

  return {
    ...profile,
    bank,
    status: mapVendorDisplayStatus(profile, user),
    user: user
      ? {
          id: user._id,
          refId: user.refId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          status: user.status,
        }
      : undefined,
  };
};

const profileService = {
  async getProfile(userId) {
    const vendor = await vendorRepository.findByUserId(userId);
    if (!vendor) throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');
    const user = await User.findById(userId).lean();
    return sanitizeProfile(vendor, user);
  },

  async updateProfile(userId, payload) {
    const vendor = await vendorRepository.findByUserId(userId);
    if (!vendor) throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');

    const vendorUpdate = {};
    const userUpdate = {};

    // Without this a vendor could take over another account's email or phone: the
    // write would otherwise succeed and leave two users sharing a login identifier.
    await registrationService.assertContactAvailable({
      email: payload.email,
      phone: payload.phone,
      exceptUserId: userId,
    });

    if (payload.name) userUpdate.name = payload.name;
    if (payload.email) userUpdate.email = payload.email;
    if (payload.phone) userUpdate.phone = payload.phone;
    if (payload.storeName) {
      vendorUpdate.storeName = payload.storeName;
      vendorUpdate.storeSlug = await registrationService.ensureUniqueStoreSlug(
        payload.storeName,
        vendor._id
      );
    }
    if (payload.serviceRadiusKm !== undefined) vendorUpdate.serviceRadiusKm = payload.serviceRadiusKm;
    if (payload.fulfillmentMethod) vendorUpdate.fulfillmentMethod = payload.fulfillmentMethod;
    if (payload.categories) vendorUpdate.categories = payload.categories;

    if (payload.address) vendorUpdate.address = { ...vendor.address, ...payload.address };
    if (payload.latitude !== undefined && payload.longitude !== undefined) {
      vendorUpdate.location = {
        type: 'Point',
        coordinates: [payload.longitude, payload.latitude],
      };
    }

    if (Object.keys(userUpdate).length) {
      await User.findByIdAndUpdate(userId, { $set: userUpdate });
    }
    const updated = await vendorRepository.updateById(vendor._id, { $set: vendorUpdate });
    const user = await User.findById(userId).lean();
    return sanitizeProfile(updated, user);
  },

  async updateBusinessInfo(userId, payload) {
    const vendor = await vendorRepository.findByUserId(userId);
    if (!vendor) throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');

    const update = {};
    if (payload.storeName) {
      update.storeName = payload.storeName;
      update.storeSlug = await uniqueSlug(VendorProfile, payload.storeName);
    }
    if (payload.categories) update.categories = payload.categories;
    if (payload.serviceRadiusKm !== undefined) update.serviceRadiusKm = payload.serviceRadiusKm;
    if (payload.fulfillmentMethod) update.fulfillmentMethod = payload.fulfillmentMethod;

    const updated = await vendorRepository.updateById(vendor._id, { $set: update });

    const user = await User.findById(userId).lean();
    return sanitizeProfile(updated, user);
  },

  async updateTaxInfo(userId, payload) {
    const vendor = await vendorRepository.findByUserId(userId);
    if (!vendor) throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');

    const update = {};
    if (payload.gstin !== undefined) update.gstin = payload.gstin;
    if (payload.panCard !== undefined) update.panCard = payload.panCard;

    const updated = await vendorRepository.updateById(vendor._id, { $set: update });
    const user = await User.findById(userId).lean();
    return sanitizeProfile(updated, user);
  },

  async updateBankDetails(userId, payload) {
    const vendor = await vendorRepository.findByUserId(userId);
    if (!vendor) throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');

    const bank = { ...(vendor.bank || {}) };
    if (payload.accountName) bank.accountName = payload.accountName;
    if (payload.bankName) bank.bankName = payload.bankName;
    if (payload.branch) bank.branch = payload.branch;
    if (payload.ifsc) bank.ifsc = payload.ifsc;
    if (payload.accountNumber) {
      const cleanAcc = String(payload.accountNumber).replace(/\s+/g, '');
      bank.accountNumber = cleanAcc;
      bank.accountNumberEnc = encryptAccountNumber(cleanAcc);
      bank.accountNumberMasked = cleanAcc;
    }

    const updated = await vendorRepository.updateById(vendor._id, { $set: { bank } });
    const user = await User.findById(userId).lean();
    const result = sanitizeProfile(updated, user);
    if (payload.accountNumber) {
      const cleanAcc = String(payload.accountNumber).replace(/\s+/g, '');
      result.bank.accountNumber = cleanAcc;
      result.bank.accountNumberMasked = cleanAcc;
    }
    return result;
  },

  async updateAddress(userId, payload) {
    const vendor = await vendorRepository.findByUserId(userId);
    if (!vendor) throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');

    const address = { ...vendor.address, ...payload };
    const update = { address };
    if (payload.latitude !== undefined && payload.longitude !== undefined) {
      update.location = { type: 'Point', coordinates: [payload.longitude, payload.latitude] };
    }

    const updated = await vendorRepository.updateById(vendor._id, { $set: update });
    const user = await User.findById(userId).lean();
    return sanitizeProfile(updated, user);
  },

  async addDocument(userId, { type, attachmentId }) {
    const vendor = await vendorRepository.findByUserId(userId);
    if (!vendor) throw new NotFoundError('Vendor profile not found', 'VENDOR_PROFILE_NOT_FOUND');

    const updated = await vendorRepository.updateById(vendor._id, {
      $push: { kycDocs: { type, attachmentId } },
    });
    const user = await User.findById(userId).lean();
    return sanitizeProfile(updated, user);
  },

  async getStatus(userId) {
    const profile = await this.getProfile(userId);
    return {
      status: profile.status,
      approvalStatus: profile.approvalStatus,
      verifiedBadge: profile.verifiedBadge,
      kycDocsCount: profile.kycDocs?.length || 0,
    };
  },
};

module.exports = profileService;
