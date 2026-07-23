const { Joi, schemas } = require('../../../common/validation');

const updateProfileSchema = Joi.object({
  // `name` is kept for non-parent roles (school/vendor/admin). Parents use the
  // explicit parentName + studentName so the two people never get conflated.
  name: Joi.string().trim().max(80).optional(),
  parentName: Joi.string().trim().max(80).optional(),
  studentName: Joi.string().trim().max(80).optional(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).max(254).allow('', null).optional(),
  phone: schemas.indianMobile.optional(),
  altPhone: schemas.indianMobile.allow('', null).optional(),
  address: Joi.string().trim().max(250).allow('', null).optional(),
  pinCode: Joi.string().trim().max(10).allow('', null).optional(),
  city: Joi.string().trim().max(100).allow('', null).optional(),
  state: Joi.string().trim().max(100).allow('', null).optional(),
  country: Joi.string().trim().max(100).allow('', null).optional(),
  photo: Joi.string().trim().allow('', null).optional(),
});

const setActiveChildSchema = Joi.object({
  childProfileId: schemas.objectId.required(),
});

module.exports = {
  updateProfileSchema,
  setActiveChildSchema,
};
