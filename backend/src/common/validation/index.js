const Joi = require('joi');
const { ValidationError } = require('../errors');
const { ALL_ROLES } = require('../../constants/roles');

const validate = (schema, source = 'body') => (req, _res, next) => {
  const data = req[source];
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errors = error.details.reduce((acc, detail) => {
      const key = detail.path.join('.') || 'value';
      acc[key] = detail.message.replace(/"/g, '');
      return acc;
    }, {});
    return next(new ValidationError('Validation failed', errors));
  }

  req[source] = value;
  return next();
};

const schemas = {
  indianMobile: Joi.string()
    .trim()
    .pattern(/^(?:\+?91|0)?[6-9]\d{9}$/)
    .messages({ 'string.pattern.base': 'Phone must be a valid 10-digit Indian mobile number' }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .max(254),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/)
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one number and one special character',
    }),

  passwordBasic: Joi.string().min(6).max(128),

  otp4: Joi.string().trim().pattern(/^\d{4}$/).messages({
    'string.pattern.base': 'OTP must be exactly 4 digits',
  }),

  otp6: Joi.string().trim().pattern(/^\d{6}$/).messages({
    'string.pattern.base': 'OTP must be exactly 6 digits',
  }),

  objectId: Joi.string().trim().pattern(/^[a-fA-F0-9]{24}$/),

  role: Joi.string().valid(...ALL_ROLES),
};

module.exports = {
  validate,
  schemas,
  Joi,
};
