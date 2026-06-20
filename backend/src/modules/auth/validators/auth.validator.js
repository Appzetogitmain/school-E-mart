const { Joi, schemas } = require('../../../common/validation');

const loginSchema = Joi.object({
  email: schemas.email.required(),
  password: schemas.passwordBasic.required(),
  role: schemas.role.optional(),
});

const roleLoginSchema = (role) =>
  Joi.object({
    email: schemas.email.required(),
    password: schemas.passwordBasic.required(),
    role: Joi.string().valid(role).default(role),
  });

const refreshSchema = Joi.object({}).default({});

const logoutSchema = Joi.object({
  revokeAll: Joi.boolean().default(false),
});

const parentOtpRequestSchema = Joi.object({
  phone: schemas.indianMobile,
  mobile: schemas.indianMobile,
})
  .or('phone', 'mobile')
  .messages({ 'object.missing': 'Phone number is required' });

const parentOtpVerifySchema = Joi.object({
  phone: schemas.indianMobile,
  mobile: schemas.indianMobile,
  otp: schemas.otp4.required(),
})
  .or('phone', 'mobile')
  .messages({ 'object.missing': 'Phone number is required' });

const parentWebLoginSchema = Joi.object({
  mobile: schemas.indianMobile.required(),
  otp: schemas.otp4.required(),
});

const parentWebRegisterOtpSchema = Joi.object({
  phone: schemas.indianMobile,
  mobile: schemas.indianMobile,
})
  .or('phone', 'mobile')
  .messages({ 'object.missing': 'Phone number is required' });

const parentWebRegisterVerifySchema = Joi.object({
  phone: schemas.indianMobile,
  mobile: schemas.indianMobile,
  otp: schemas.otp6.required(),
})
  .or('phone', 'mobile')
  .messages({ 'object.missing': 'Phone number is required' });

const forgotPasswordSchema = Joi.object({
  email: schemas.email.required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().trim().min(32).max(256).required(),
  newPassword: schemas.password.required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Password confirmation must match new password',
  }),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: schemas.password.required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Password confirmation must match new password',
  }),
});

const emailVerifySchema = Joi.object({
  token: Joi.string().trim().required(),
});

const emailVerifyRequestSchema = Joi.object({}).default({});

module.exports = {
  loginSchema,
  roleLoginSchema,
  refreshSchema,
  logoutSchema,
  schoolAdminLoginSchema: roleLoginSchema('school'),
  teacherLoginSchema: roleLoginSchema('teacher'),
  vendorLoginSchema: roleLoginSchema('vendor'),
  superAdminLoginSchema: roleLoginSchema('admin'),
  parentOtpRequestSchema,
  parentOtpVerifySchema,
  parentWebLoginSchema,
  parentWebRegisterOtpSchema,
  parentWebRegisterVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  emailVerifySchema,
  emailVerifyRequestSchema,
};
