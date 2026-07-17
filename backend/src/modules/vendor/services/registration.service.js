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

// Drop keys the caller left blank so they fall through to the defaults below
// rather than failing the model's `required` checks.
const pruneEmpty = (obj = {}) =>
  Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

// Signup collects the minimum, so unsupplied address fields get these markers and
// the vendor completes them later on their profile page. The page detects exactly
// these values and flags them as "still needed".
const ADDRESS_PLACEHOLDERS = {
  line1: 'Pending',
  city: 'Pending',
  state: 'Pending',
  country: 'India',
  pinCode: '000000',
};

// Coordinates default to central Delhi until the vendor sets a real location.
const DEFAULT_COORDINATES = [77.209, 28.6139];

/**
 * Every address field is `required` on VendorProfile, so a partially filled
 * address must still be completed with defaults. Merging per-field (rather than
 * only defaulting when `address` is absent entirely) is what makes a partial
 * address usable.
 */
const buildAddress = (payload) => ({
  ...ADDRESS_PLACEHOLDERS,
  ...pruneEmpty(payload.address),
});

// Single conversion point from the API's latitude/longitude to the GeoJSON
// [lng, lat] the model stores. Keeping it here stops the order being flipped.
const buildCoordinates = (payload) =>
  payload.latitude !== undefined && payload.longitude !== undefined
    ? [payload.longitude, payload.latitude]
    : DEFAULT_COORDINATES;

/**
 * Guards email/phone uniqueness for *updates*, where a value already belonging to
 * the account itself must be allowed through.
 *
 * The DB indexes cannot be relied on for this: `autoIndex` is disabled in
 * production, so the unique index may not exist, and even where it does the caller
 * gets an opaque E11000 instead of a clean 409.
 */
const assertContactAvailable = async ({ email, phone, exceptUserId }) => {
  if (email) {
    const owner = await userRepository.findByEmail(email);
    if (owner && String(owner._id) !== String(exceptUserId)) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
    }
  }
  if (phone) {
    const owner = await userRepository.findByPhone(phone);
    if (owner && String(owner._id) !== String(exceptUserId)) {
      throw new ConflictError('Phone already registered', 'PHONE_EXISTS');
    }
  }
};

const registrationService = {
  assertContactAvailable,

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

    let profile;
    try {
      profile = await VendorProfile.create({
        userId: user._id,
        storeName: payload.storeName,
        storeSlug,
        commissionPercent: payload.commissionPercent ?? 10,
        approvalStatus: 'pending',
        address: buildAddress(payload),
        location: {
          type: 'Point',
          coordinates: buildCoordinates(payload),
        },
        serviceRadiusKm: payload.serviceRadiusKm ?? 10,
        categories: payload.categories || [],
      });
    } catch (error) {
      // The user row is written before the profile and transactions are not
      // guaranteed here, so undo it by hand. Leaving it behind would burn the
      // email and phone forever: every retry would fail with EMAIL_EXISTS.
      await User.deleteOne({ _id: user._id });
      throw error;
    }

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
