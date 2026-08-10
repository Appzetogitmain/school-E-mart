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
  let course = await courseRepository.findOne({ _id: courseId, schoolId });
  if (!course && schoolId) {
    course = await courseRepository.findOne({ _id: courseId, schoolId: null });
  }
  if (!course) {
    throw new NotFoundError('Course not found', 'COURSE_NOT_FOUND');
  }
  return course;
};

// A course with no grade (or the school-wide catalog target) is shared LMS content,
// not one class's coursework — there is no single teacher to check ownership against.
const isUniversalOrUngradedCourse = (gradeClass) =>
  !gradeClass || gradeClass.trim().toLowerCase() === 'all grades';

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

  req.teacherProfile = profile;

  // Approval alone used to be enough to manage any course in the school — any teacher
  // could edit/delete/grade a colleague's homework. A class-scoped course is that
  // class's coursework, so only a teacher actually assigned to teach that class +
  // subject (per their classAssignments) may manage it.
  if (isUniversalOrUngradedCourse(course.gradeClass)) return;

  const courseGrade = normalizeGrade(course.gradeClass);
  const courseSubject = String(course.subject || '').trim().toLowerCase();
  const isAssigned = (profile.classAssignments || []).some(
    (assignment) =>
      normalizeGrade(assignment.class) === courseGrade &&
      (!courseSubject ||
        (assignment.subjects || []).some(
          (subject) => String(subject).trim().toLowerCase() === courseSubject
        ))
  );

  if (!isAssigned) {
    throw new ForbiddenError(
      'You are not assigned to teach this class and subject',
      'LMS_COURSE_NOT_ASSIGNED'
    );
  }
};

// classGrade is free text across the app ("5", "Class 5", "class  5"), so compare
// on the normalized form rather than the raw strings.
const normalizeGrade = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/class/g, '')
    .replace(/\s+/g, '')
    .trim();

/**
 * A school course scoped to the student's own class is coursework, not an opt-in
 * catalogue course: the student is enrolled by virtue of being in that class. Create
 * the enrollment on first access so homework doesn't 403 for a whole class that was
 * never explicitly enrolled.
 */
const isUniversalGradeTarget = (gradeClass) =>
  !gradeClass || gradeClass.trim().toLowerCase() === 'all grades';

const autoEnrollForClassCourse = async (schoolId, courseId, student, userId) => {
  let course = await courseRepository.findOne({ _id: courseId, schoolId });
  let isPlatformCourse = false;
  if (!course) {
    // Platform-wide courses (schoolId: null) aren't tied to any one school's
    // class roster, so the student was never going to be "in the class" the
    // way school-authored coursework works. Auto-enroll on grade targeting
    // instead: "All Grades" (or no target set) matches every student, a
    // specific grade matches only that grade's students.
    course = await courseRepository.findOne({ _id: courseId, schoolId: null });
    isPlatformCourse = true;
  }
  if (!course) return null;

  if (isPlatformCourse) {
    if (!isUniversalGradeTarget(course.gradeClass) && normalizeGrade(course.gradeClass) !== normalizeGrade(student.classGrade)) {
      return null;
    }
  } else {
    if (!course.gradeClass) return null;
    if (normalizeGrade(course.gradeClass) !== normalizeGrade(student.classGrade)) return null;
  }

  try {
    return await enrollmentRepository.create({
      schoolId,
      courseId,
      studentId: student._id,
      userId,
      status: 'active',
    });
  } catch (error) {
    // Concurrent first access races on the unique (school, course, student) index;
    // the loser just reads back the winner's row.
    if (error?.code === 11000) {
      return enrollmentRepository.findEnrollment(schoolId, courseId, student._id);
    }
    throw error;
  }
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

  let enrollment = await enrollmentRepository.findEnrollment(
    req.schoolId,
    courseId,
    resolved.student._id
  );

  if (!enrollment) {
    enrollment = await autoEnrollForClassCourse(
      req.schoolId,
      courseId,
      resolved.student,
      resolved.userId
    );
  }

  // A withdrawn enrollment is a deliberate removal, so it is never auto-restored.
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
