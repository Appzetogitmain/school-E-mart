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

const refreshSchema = Joi.object({
  refreshToken: Joi.string().trim().min(32).max(128).optional(),
}).default({});

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

const sessionIdParamSchema = Joi.object({
  sessionId: schemas.objectId.required(),
});

const parentRegisterSchema = Joi.object({
  phone: schemas.indianMobile.required(),
  studentName: Joi.string().trim().max(80).required(),
  grade: Joi.string().trim().required(),
  classGrade: Joi.string().trim().optional(),
  schoolRefNo: Joi.string().trim().allow('', null).optional(),
});

const teacherRegisterSchema = Joi.object({
  fullName: Joi.string().trim().max(80).required(),
  email: schemas.email.required(),
  mobile: schemas.indianMobile.required(),
  schoolCode: Joi.string().trim().required(),
  password: schemas.password.required(),
});

const schoolAdminRegisterSchema = Joi.object({
  schoolName: Joi.string().trim().max(120).required(),
  fullName: Joi.string().trim().max(80).required(),
  email: schemas.email.required(),
  mobile: schemas.indianMobile.required(),
  password: schemas.password.required(),
});

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
  sessionIdParamSchema,
  parentRegisterSchema,
  teacherRegisterSchema,
  schoolAdminRegisterSchema,
};
