const mongoose = require('mongoose');
const { ForbiddenError, NotFoundError } = require('../../../common/errors');
const { roles } = require('../../../constants');
const tenantPolicy = require('../../auth/policies/tenant.policy');
const TeacherProfile = require('../../../database/models/TeacherProfile');
const { classGradeMatches } = require('../utils/classGrade');

const { ROLES } = roles;

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

const resolveTargetSchoolId = async (req) => {
  const fromParams = req.params.schoolId;
  const fromTenant = req.tenant?.schoolId || req.auth?.tenantSchoolId;
  const requested = fromParams || fromTenant;

  if (tenantPolicy.isSuperAdmin(req.auth)) {
    return toObjectId(requested);
  }

  if (req.auth?.role === ROLES.SCHOOL_ADMIN) {
    const schoolId = toObjectId(req.auth.tenantSchoolId);
    if (fromParams && String(fromParams) !== String(schoolId)) {
      throw new ForbiddenError('Cross-tenant access is not allowed', 'TENANT_FORBIDDEN');
    }
    return schoolId;
  }

  if (req.auth?.role === ROLES.TEACHER) {
    const schoolId = toObjectId(req.auth.tenantSchoolId);
    if (fromParams && String(fromParams) !== String(schoolId)) {
      throw new ForbiddenError('Cross-tenant access is not allowed', 'TENANT_FORBIDDEN');
    }
    return schoolId;
  }

  if (req.auth?.role === ROLES.PARENT) {
    const ChildProfile = require('../../../database/models/ChildProfile');
    const child = await ChildProfile.findOne({ parentUserId: req.auth.userId, 'softDelete.isDeleted': { $ne: true } }).lean();
    if (!child || !child.schoolId) {
      throw new ForbiddenError('No associated school found for child profile', 'SCHOOL_REQUIRED');
    }
    const schoolId = child.schoolId;
    if (fromParams && String(fromParams) !== String(schoolId)) {
      throw new ForbiddenError('Cross-tenant access is not allowed', 'TENANT_FORBIDDEN');
    }
    return schoolId;
  }

  throw new ForbiddenError('You do not have permission to access this school', 'SCHOOL_ACCESS_DENIED');
};

const assertSchoolAccess = async (req) => {
  const schoolId = await resolveTargetSchoolId(req);
  if (!schoolId) {
    throw new ForbiddenError('School context is required', 'SCHOOL_REQUIRED');
  }
  req.schoolId = schoolId.toString();
  return schoolId;
};

const assertTeacherClassAccess = async (req, { classGrade, section }) => {
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

  // Assignments and requests disagree on whether the grade carries the "Class "
  // prefix, so compare the normalized forms rather than the raw strings.
  const hasAssignment = (profile.classAssignments || []).some(
    (item) =>
      classGradeMatches(item.class, classGrade) &&
      (!section ||
        String(item.section).trim().toUpperCase() === String(section).trim().toUpperCase())
  );

  if (!hasAssignment) {
    throw new ForbiddenError('You are not assigned to this class', 'CLASS_ACCESS_DENIED');
  }

  req.teacherProfile = profile;
};

const assertStudentOwnership = async (req, student) => {
  if (req.auth.role === ROLES.PARENT) {
    const ParentProfile = require('../../../database/models/ParentProfile');
    const profile = await ParentProfile.findOne({
      userId: req.auth.userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();

    if (!profile || !student.parentProfileIds?.some((id) => String(id) === String(profile._id))) {
      throw new ForbiddenError('You can only access your own children', 'STUDENT_ACCESS_DENIED');
    }
  }
};

module.exports = {
  resolveTargetSchoolId,
  assertSchoolAccess,
  assertTeacherClassAccess,
  assertStudentOwnership,
};
