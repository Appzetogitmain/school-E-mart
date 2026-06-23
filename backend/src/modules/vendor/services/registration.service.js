const { ConflictError, BadRequestError } = require('../../../common/errors');
const User = require('../../../database/models/User');
const { hashPassword, normalizeEmail, normalizePhone } = require('../../../utils');
const { generateUserRefId } = require('../../school/utils/refId');
const { uniqueSlug } = require('../../marketplace/utils/slug');
const VendorProfile = require('../../../database/models/VendorProfile');
const vendorRepository = require('../repositories/vendor.repository');
const userRepository = require('../../auth/repositories/user.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const { mapVendorDisplayStatus } = require('../utils/status');

const registrationService = {
  async register(payload, requestMeta = {}) {
    const email = normalizeEmail(payload.email);
    const phone = normalizePhone(payload.phone);

    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) throw new ConflictError('Email already registered', 'EMAIL_EXISTS');

    const existingPhone = await userRepository.findByPhone(phone);
    if (existingPhone) throw new ConflictError('Phone already registered', 'PHONE_EXISTS');

    const storeSlug = await uniqueSlug(VendorProfile, payload.storeName);
    const { hash, algo } = await hashPassword(payload.password);
    const refId = generateUserRefId('VEN');

    const user = await User.create({
      refId,
      role: 'vendor',
      status: 'active',
      name: payload.name,
      email,
      phone,
      passwordHash: hash,
      passwordAlgo: algo,
    });

    const profile = await VendorProfile.create({
      userId: user._id,
      storeName: payload.storeName,
      storeSlug,
      commissionPercent: payload.commissionPercent ?? 10,
      approvalStatus: 'pending',
      address: payload.address || {
        line1: payload.location || 'Pending',
        city: payload.city || 'Pending',
        state: payload.state || 'Pending',
        country: payload.country || 'India',
        pinCode: payload.pinCode || '000000',
      },
      location: {
        type: 'Point',
        coordinates: payload.coordinates || [77.209, 28.6139],
      },
      serviceRadiusKm: payload.serviceRadiusKm ?? 10,
      categories: payload.categories || [],
    });

    await auditRepository.log({
      actorUserId: user._id,
      actorRole: 'vendor',
      action: 'vendor.registered',
      entityType: 'VendorProfile',
      entityId: profile._id,
      ipAddress: requestMeta.ipAddress,
      userAgent: requestMeta.userAgent,
      correlationId: requestMeta.requestId,
      after: { storeName: profile.storeName, refId },
    });

    return {
      user: {
        id: user._id,
        refId: user.refId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      profile: {
        id: profile._id,
        storeName: profile.storeName,
        storeSlug: profile.storeSlug,
        status: mapVendorDisplayStatus(profile, user),
      },
    };
  },

  async ensureUniqueStoreSlug(storeName, excludeVendorId = null) {
    const slug = await uniqueSlug(VendorProfile, storeName);
    if (excludeVendorId) {
      const existing = await vendorRepository.findByStoreSlug(slug);
      if (existing && String(existing._id) !== String(excludeVendorId)) {
        throw new BadRequestError('Store name already taken', null, 'STORE_NAME_EXISTS');
      }
    }
    return slug;
  },
};

module.exports = registrationService;
