const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const schoolRepository = require('../repositories/school.repository');
const { generateSchoolCode } = require('../utils/refId');
const { saveBase64File } = require('../../../utils/fileStorage');
const { runAtomic } = require('../../orders/utils/atomic');
const auditRepository = require('../../auth/repositories/audit.repository');
const School = require('../../../database/models/School');
const Student = require('../../../database/models/Student');
const TeacherProfile = require('../../../database/models/TeacherProfile');
const SchoolStaffProfile = require('../../../database/models/SchoolStaffProfile');
const SchoolMembership = require('../../../database/models/SchoolMembership');
const Kit = require('../../../database/models/Kit');
const SchoolKitCategory = require('../../../database/models/SchoolKitCategory');
const User = require('../../../database/models/User');

// Every logo must end up as a file under UPLOADS_DIR — never a third-party
// URL or a raw un-decoded string sitting in the DB. saveBase64File() returns
// null for anything it doesn't recognize (not a data: URI, not an existing
// /uploads/... path), and the old code let that raw, unrecognized value fall
// straight through to `logoUrl` on `null` — silently writing back a stale/
// broken value (or a caller-supplied external URL) instead of rejecting it.
// This mutates updatePayload in place: on success, logoUrl becomes the saved
// local path; on failure, the field is dropped entirely so a bad value never
// reaches the DB and an existing good logo isn't clobbered by garbage.
const normalizeLogoPayload = (updatePayload) => {
  const rawLogo = updatePayload.logoUrl || updatePayload.logo || updatePayload.photo;
  if (rawLogo) {
    const saved = saveBase64File(rawLogo, 'school-logo');
    if (saved) {
      updatePayload.logoUrl = saved;
    } else {
      delete updatePayload.logoUrl;
    }
  }
  delete updatePayload.logo;
  delete updatePayload.photo;
};

const schoolService = {
  async createSchool(payload) {
    const code = payload.code || generateSchoolCode(payload.name);
    const existing = await schoolRepository.findByCode(code);
    if (existing) {
      throw new ConflictError('School code already exists', 'SCHOOL_CODE_EXISTS');
    }

    const refExisting = await schoolRepository.findBySchoolRefNo(payload.schoolRefNo);
    if (refExisting) {
      throw new ConflictError('School reference number already exists', 'SCHOOL_REF_EXISTS');
    }

    const updatePayload = { ...payload };
    normalizeLogoPayload(updatePayload);

    return schoolRepository.create({
      ...updatePayload,
      code,
      gradesOffered: payload.gradesOffered || [],
      sectionsConfig: payload.sectionsConfig || [],
    });
  },

  async getSchool(schoolId) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    return school;
  },

  async listSchools(query) {
    return schoolRepository.paginateSchools({}, query);
  },

  async updateSchool(schoolId, payload) {
    const updatePayload = { ...payload };
    normalizeLogoPayload(updatePayload);

    const school = await schoolRepository.updateById(schoolId, { $set: updatePayload });
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    return school;
  },

  // Hard delete, per product decision: a removed school is gone, along with
  // everything that only makes sense in its context (students, teacher and
  // staff accounts, kits, class-kit categories, school memberships). Orders
  // are deliberately left untouched — they're financial/business history
  // (vendor payouts, revenue reporting), not roster data, so they survive
  // the school that placed them the same way the rest of the app already
  // treats orders as immutable once created.
  async deleteSchool(schoolId, deletedBy) {
    const school = await School.findById(schoolId).lean();
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const teachers = await TeacherProfile.find({ schoolId }).select('userId').lean();
    const staff = await SchoolStaffProfile.find({ schoolId }).select('userId').lean();
    const teacherUserIds = teachers.map((t) => t.userId);
    const staffUserIds = staff.map((s) => s.userId);
    // Snapshot counts before the cascade removes the rows they'd be counting.
    const studentsRemoved = await Student.countDocuments({ schoolId });

    await runAtomic(async (session) => {
      await Student.deleteMany({ schoolId }).session(session);
      await TeacherProfile.deleteMany({ schoolId }).session(session);
      await SchoolStaffProfile.deleteMany({ schoolId }).session(session);
      if (teacherUserIds.length) {
        await User.deleteMany({ _id: { $in: teacherUserIds } }).session(session);
      }
      if (staffUserIds.length) {
        await User.deleteMany({ _id: { $in: staffUserIds } }).session(session);
      }
      await SchoolMembership.deleteMany({ schoolId }).session(session);
      await Kit.deleteMany({ schoolId }).session(session);
      await SchoolKitCategory.deleteMany({ schoolId }).session(session);
      await School.deleteOne({ _id: schoolId }).session(session);
    });

    await auditRepository.log({
      actorUserId: deletedBy,
      action: 'school.deleted_by_admin',
      entityType: 'School',
      entityId: schoolId,
      after: {
        name: school.name,
        studentsRemoved,
        teachersRemoved: teacherUserIds.length,
        staffRemoved: staffUserIds.length,
      },
    });

    return school;
  },
};

module.exports = schoolService;
