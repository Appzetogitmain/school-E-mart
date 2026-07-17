const { Joi } = require('../../../common/validation');

/**
 * Single source of truth for vendor field rules.
 *
 * Vendor-facing and admin-facing routes both write the same VendorProfile, so they
 * must agree on what a valid value is. These lived as separate copies and drifted:
 * account numbers accepted letters on one side and 6 digits on the other, and PAN
 * was auto-uppercased for admins but rejected for vendors. Import from here rather
 * than redefining.
 */

// Postal address only. Map coordinates are NOT part of this: the model stores them
// as GeoJSON under `location`, and nesting them here meant they were silently
// dropped by strict-mode casting.
// line2 is the only optional line on the model, so it is the only one that may be
// cleared. The rest are `required` on VendorProfile — accepting '' for them would
// let a caller blank out a field the model insists on.
const addressSchema = Joi.object({
  line1: Joi.string().trim().min(1).max(200).optional(),
  line2: Joi.string().trim().max(200).allow('').optional(),
  city: Joi.string().trim().min(1).max(80).optional(),
  state: Joi.string().trim().min(1).max(80).optional(),
  country: Joi.string().trim().min(1).max(80).optional(),
  pinCode: Joi.string().trim().pattern(/^\d{6}$/).optional()
    .messages({ 'string.pattern.base': 'PIN code must be exactly 6 digits' }),
});

// Standardised on latitude/longitude everywhere. A bare [lng, lat] array is easy
// to reverse by accident; the service converts to GeoJSON order on write.
const latitude = Joi.number().min(-90).max(90);
const longitude = Joi.number().min(-180).max(180);

const geoFields = {
  latitude: latitude.optional(),
  longitude: longitude.optional(),
};

const taxFields = {
  gstin: Joi.string().trim().uppercase()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/)
    .allow('')
    .optional()
    .messages({ 'string.pattern.base': 'GSTIN must be a valid 15-character GST number' }),
  panCard: Joi.string().trim().uppercase()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .allow('')
    .optional()
    .messages({ 'string.pattern.base': 'PAN must be 5 letters, 4 digits, then 1 letter' }),
};

const bankSchema = Joi.object({
  accountName: Joi.string().trim().max(120).allow('').optional(),
  bankName: Joi.string().trim().max(120).allow('').optional(),
  branch: Joi.string().trim().max(120).allow('').optional(),
  // Indian account numbers are digits only. Stored as a one-way HMAC, so it can be
  // set but never read back.
  accountNumber: Joi.string().trim().pattern(/^\d{8,20}$/).optional()
    .messages({ 'string.pattern.base': 'Account number must be 8-20 digits' }),
  ifsc: Joi.string().trim().uppercase()
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .allow('')
    .optional()
    .messages({ 'string.pattern.base': 'IFSC must be 4 letters, a 0, then 6 characters' }),
});

const identityFields = {
  name: Joi.string().trim().min(2).max(80),
  storeName: Joi.string().trim().min(2).max(80),
  serviceRadiusKm: Joi.number().min(0).max(500),
  categories: Joi.array().items(require('../../../common/validation').schemas.objectId),
};

module.exports = {
  addressSchema,
  geoFields,
  taxFields,
  bankSchema,
  identityFields,
  latitude,
  longitude,
};
