const { Joi, schemas } = require('../../../common/validation');

/**
 * Single source of truth for school field rules.
 *
 * Public signup and the admin "Add School" form both write the same School and
 * User documents, so they must agree on what a valid value is. Defining them
 * twice is how the vendor module ended up accepting different account-number
 * formats on each side — import from here rather than redefining.
 */

// Every line is optional: signup asks for the minimum and the school fills the
// rest in later, so a partial address must be accepted rather than 400'd.
const addressSchema = Joi.object({
  line1: Joi.string().trim().max(200).allow('').optional(),
  line2: Joi.string().trim().max(200).allow('').optional(),
  city: Joi.string().trim().max(80).allow('').optional(),
  state: Joi.string().trim().max(80).allow('').optional(),
  country: Joi.string().trim().max(80).allow('').optional(),
  pinCode: Joi.string().trim().pattern(/^\d{6}$/).allow('').optional()
    .messages({ 'string.pattern.base': 'PIN code must be exactly 6 digits' }),
});

const identityFields = {
  schoolName: Joi.string().trim().min(2).max(120),
  fullName: Joi.string().trim().min(2).max(80),
  principalName: Joi.string().trim().min(2).max(80),
};

// "2024-25" / "2024-2025". Stored as a plain string on the model, so without a
// pattern the admin table renders whatever was typed.
const academicYear = Joi.string().trim().pattern(/^\d{4}-\d{2}(\d{2})?$/)
  .messages({ 'string.pattern.base': 'Academic year must look like 2024-25 or 2024-2025' });

const profileFields = {
  address: addressSchema.optional(),
  academicYearCurrent: academicYear.allow('').optional(),
  gradesOffered: Joi.array().items(Joi.string().trim().max(20)).max(30).optional(),
};

const contactFields = {
  email: schemas.email,
  mobile: schemas.indianMobile,
};

module.exports = {
  addressSchema,
  identityFields,
  profileFields,
  contactFields,
  academicYear,
};
