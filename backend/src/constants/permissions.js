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
  LMS_READ: 'lms.read',
  LMS_WRITE: 'lms.write',
  LMS_MANAGE: 'lms.manage',
  NOTICES_READ: 'notices.read',
  NOTICES_SEND: 'notices.send',
  DIARY_READ: 'diary.read',
  DIARY_WRITE: 'diary.write',
  // Kits, events and phonebook entries used to be gated on NOTICES_SEND — coupling
  // three unrelated capabilities to "can send notices". A staff account scoped to
  // just one of these could not be expressed at all.
  KITS_MANAGE: 'kits.manage',
  EVENTS_MANAGE: 'events.manage',
  PHONEBOOK_MANAGE: 'phonebook.manage',
  ORDERS_READ: 'orders.read',
  ORDERS_WRITE: 'orders.write',
  CATALOG_READ: 'catalog.read',
  CATALOG_WRITE: 'catalog.write',
  VENDOR_MANAGE: 'vendor.manage',
  PLATFORM_ADMIN: '*',
};

const ROLE_DEFAULT_PERMISSIONS = {
  parent: [PERMISSIONS.LMS_READ, PERMISSIONS.CATALOG_READ, PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_WRITE, PERMISSIONS.ATTENDANCE_READ, PERMISSIONS.NOTICES_READ, PERMISSIONS.DIARY_READ],
  school: [
    PERMISSIONS.SCHOOLS_READ,
    PERMISSIONS.SCHOOLS_WRITE,
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
    PERMISSIONS.LMS_READ,
    PERMISSIONS.LMS_WRITE,
    PERMISSIONS.LMS_MANAGE,
    PERMISSIONS.NOTICES_READ,
    PERMISSIONS.NOTICES_SEND,
    PERMISSIONS.DIARY_READ,
    PERMISSIONS.DIARY_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.KITS_MANAGE,
    PERMISSIONS.EVENTS_MANAGE,
    PERMISSIONS.PHONEBOOK_MANAGE,
  ],
  teacher: [
    PERMISSIONS.STUDENTS_READ,
    PERMISSIONS.STUDENTS_WRITE,
    PERMISSIONS.CLASSES_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_WRITE,
    PERMISSIONS.TIMETABLE_READ,
    PERMISSIONS.LMS_READ,
    PERMISSIONS.LMS_WRITE,
    // Every LMS authoring route (assignments, submissions, grading, courses,
    // chapters, lessons) is gated on LMS_MANAGE, not LMS_WRITE. Teachers need it
    // to set and grade homework.
    PERMISSIONS.LMS_MANAGE,
    PERMISSIONS.NOTICES_READ,
    PERMISSIONS.NOTICES_SEND,
    PERMISSIONS.DIARY_READ,
    PERMISSIONS.DIARY_WRITE,
  ],
  vendor: [
    PERMISSIONS.CATALOG_READ,
    PERMISSIONS.CATALOG_WRITE,
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
  ],
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
