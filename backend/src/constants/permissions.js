/**
 * Permission constants for RBAC.
 * School staff permissions are stored on SchoolStaffProfile.permissions.
 * Super admin scopes are stored on AdminProfile.scopes.
 */
const PERMISSIONS = {
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  STUDENTS_READ: 'students.read',
  STUDENTS_WRITE: 'students.write',
  SCHOOLS_READ: 'schools.read',
  SCHOOLS_WRITE: 'schools.write',
  TEACHERS_READ: 'teachers.read',
  TEACHERS_WRITE: 'teachers.write',
  CLASSES_READ: 'classes.read',
  CLASSES_WRITE: 'classes.write',
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_WRITE: 'attendance.write',
  TIMETABLE_READ: 'timetable.read',
  TIMETABLE_WRITE: 'timetable.write',
  NOTICES_READ: 'notices.read',
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
  school: [
    PERMISSIONS.SCHOOLS_READ,
    PERMISSIONS.TEACHERS_READ,
    PERMISSIONS.TEACHERS_WRITE,
    PERMISSIONS.CLASSES_READ,
    PERMISSIONS.CLASSES_WRITE,
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_WRITE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.TIMETABLE_READ,
    PERMISSIONS.TIMETABLE_WRITE,
    PERMISSIONS.NOTICES_READ,
    PERMISSIONS.NOTICES_SEND,
    PERMISSIONS.ORDERS_READ,
  ],
  teacher: [
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.TIMETABLE_READ,
    PERMISSIONS.NOTICES_READ,
  ],
  vendor: [PERMISSIONS.CATALOG_READ, PERMISSIONS.CATALOG_WRITE, PERMISSIONS.ORDERS_READ],
  admin: [PERMISSIONS.PLATFORM_ADMIN],
};

const ROLE_ROUTE_ACCESS = {
  parent: ['parent'],
  school: ['school'],
  teacher: ['teacher'],
  vendor: ['vendor'],
  admin: ['admin'],
};

module.exports = {
  PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_ROUTE_ACCESS,
};
