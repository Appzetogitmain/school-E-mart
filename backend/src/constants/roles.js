/**
 * Application roles aligned with User.role enum in the database.
 * "student" is not a login role — student context is via parent + ChildProfile.
 */
const ROLES = {
  PARENT: 'parent',
  SCHOOL_ADMIN: 'school',
  TEACHER: 'teacher',
  VENDOR: 'vendor',
  SUPER_ADMIN: 'admin',
};

const ROLE_LABELS = {
  [ROLES.PARENT]: 'Parent',
  [ROLES.SCHOOL_ADMIN]: 'School Admin',
  [ROLES.TEACHER]: 'Teacher',
  [ROLES.VENDOR]: 'Vendor',
  [ROLES.SUPER_ADMIN]: 'Super Admin',
};

const PASSWORD_ROLES = [
  ROLES.SCHOOL_ADMIN,
  ROLES.TEACHER,
  ROLES.VENDOR,
  ROLES.SUPER_ADMIN,
];

const ALL_ROLES = Object.values(ROLES);

module.exports = {
  ROLES,
  ROLE_LABELS,
  PASSWORD_ROLES,
  ALL_ROLES,
};
