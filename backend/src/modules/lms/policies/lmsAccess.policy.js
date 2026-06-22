const mongoose = require('mongoose');
const { ForbiddenError, NotFoundError } = require('../../../common/errors');
const { roles } = require('../../../constants');
const tenantPolicy = require('../../auth/policies/tenant.policy');
const courseRepository = require('../repositories/course.repository');
const { enrollmentRepository } = require('../repositories/progress.repository');
const studentRepository = require('../repositories/student.repository');
const TeacherProfile = require('../../../database/models/TeacherProfile');

const { ROLES } = roles;

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const resolveSchoolId = (req) => {
  const fromParams = req.params.schoolId;
  const fromTenant = req.tenant?.schoolId || req.auth?.tenantSchoolId;
  const requested = fromParams || fromTenant;

  if (tenantPolicy.isSuperAdmin(req.auth)) {
    return toObjectId(requested);
  }

  if ([ROLES.SCHOOL_ADMIN, ROLES.TEACHER].includes(req.auth?.role)) {
    const schoolId = toObjectId(req.auth.tenantSchoolId);
    if (fromParams && String(fromParams) !== String(schoolId)) {
      throw new ForbiddenError('Cross-tenant access is not allowed', 'TENANT_FORBIDDEN');
    }
    return schoolId;
  }

  if (req.auth?.role === ROLES.PARENT) {
    const schoolId = toObjectId(fromParams || fromTenant);
    return schoolId;
  }

  throw new ForbiddenError('You do not have permission to access this school LMS', 'LMS_ACCESS_DENIED');
};

const assertSchoolLmsAccess = async (req) => {
  const schoolId = resolveSchoolId(req);
  if (!schoolId) {
    throw new ForbiddenError('School context is required', 'SCHOOL_REQUIRED');
  }
  req.schoolId = schoolId.toString();
  return schoolId;
};

const assertCourseInSchool = async (schoolId, courseId) => {
  const course = await courseRepository.findOne({ _id: courseId, schoolId });
  if (!course) {
    throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
  }
  return course;
};

const assertTeacherCourseAccess = async (req, course) => {
  if (req.auth.role !== ROLES.TEACHER) return;

  const profile = await TeacherProfile.findOne({
    userId: req.auth.userId,
    schoolId: req.schoolId,
    approvalStatus: 'approved',
    'softDelete.isDeleted': { $ne: true },
  }).lean();

  if (!profile) {
    throw new ForbiddenError('Teacher profile not found', 'TEACHER_PROFILE_NOT_FOUND');
  }

  if (course.instructorUserId && String(course.instructorUserId) !== String(req.auth.userId)) {
    throw new ForbiddenError('You can only manage your assigned courses', 'COURSE_ACCESS_DENIED');
  }

  req.teacherProfile = profile;
};

const assertEnrollmentAccess = async (req, courseId, studentId = null) => {
  if ([ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER].includes(req.auth.role)) {
    return null;
  }

  if (req.auth.role !== ROLES.PARENT) {
    throw new ForbiddenError('Enrollment required', 'ENROLLMENT_REQUIRED');
  }

  const resolved = await studentRepository.resolveStudentForUser(req.schoolId, req.auth.userId, studentId);
  if (!resolved) {
    throw new ForbiddenError('Student context is required', 'STUDENT_REQUIRED');
  }

  const enrollment = await enrollmentRepository.findEnrollment(
    req.schoolId,
    courseId,
    resolved.student._id
  );

  if (!enrollment || enrollment.status === 'withdrawn') {
    throw new ForbiddenError('You are not enrolled in this course', 'ENROLLMENT_REQUIRED');
  }

  req.lmsStudent = resolved.student;
  req.lmsUserId = resolved.userId;
  return enrollment;
};

const assertManageAccess = async (req, course) => {
  if (tenantPolicy.isSuperAdmin(req.auth)) return;
  if (req.auth.role === ROLES.SCHOOL_ADMIN) return;
  if (req.auth.role === ROLES.TEACHER) {
    await assertTeacherCourseAccess(req, course);
    return;
  }
  throw new ForbiddenError('You cannot manage LMS content', 'LMS_MANAGE_DENIED');
};

module.exports = {
  assertSchoolLmsAccess,
  assertCourseInSchool,
  assertTeacherCourseAccess,
  assertEnrollmentAccess,
  assertManageAccess,
};
