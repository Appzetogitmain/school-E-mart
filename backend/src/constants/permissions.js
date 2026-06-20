/**
 * Permission constants for RBAC (Phase 3 middleware).
 * School staff permissions are stored on SchoolStaffProfile.permissions.
 * Super admin scopes are stored on AdminProfile.scopes.
 */
const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  STUDENTS_READ: 'students.read',
  STUDENTS_WRITE: 'students.write',
  NOTICES_SEND: 'notices.send',
  ORDERS_READ: 'orders.read',
  ORDERS_WRITE: 'orders.write',
  CATALOG_READ: 'catalog.read',
  CATALOG_WRITE: 'catalog.write',
  VENDOR_MANAGE: 'vendor.manage',
  PLATFORM_ADMIN: '*',
};

const ROLE_DEFAULT_PERMISSIONS = {
  parent: [],
  school: [PERMISSIONS.STUDENTS_READ, PERMISSIONS.STUDENTS_WRITE, PERMISSIONS.NOTICES_SEND],
  teacher: [PERMISSIONS.STUDENTS_READ],
  vendor: [PERMISSIONS.CATALOG_READ, PERMISSIONS.CATALOG_WRITE, PERMISSIONS.ORDERS_READ],
  admin: [PERMISSIONS.PLATFORM_ADMIN],
};

module.exports = {
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
};
