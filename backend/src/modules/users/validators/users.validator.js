const { Joi, schemas } = require('../../../common/validation');

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().max(80).optional(),
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

module.exports = {
  updateProfileSchema,
};
