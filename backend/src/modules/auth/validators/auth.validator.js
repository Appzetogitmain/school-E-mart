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

module.exports = {
  loginSchema,
  roleLoginSchema,
  refreshSchema,
  logoutSchema,
  schoolAdminLoginSchema: roleLoginSchema('school'),
  teacherLoginSchema: roleLoginSchema('teacher'),
  vendorLoginSchema: roleLoginSchema('vendor'),
  superAdminLoginSchema: roleLoginSchema('admin'),
};
