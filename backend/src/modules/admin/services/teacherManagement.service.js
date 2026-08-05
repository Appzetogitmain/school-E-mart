const { NotFoundError, ConflictError } = require('../../../common/errors');
const { normalizePhone } = require('../../../utils');
const { runAtomic } = require('../../orders/utils/atomic');
const auditRepository = require('../../auth/repositories/audit.repository');
const User = require('../../../database/models/User');
const TeacherProfile = require('../../../database/models/TeacherProfile');
const SchoolMembership = require('../../../database/models/SchoolMembership');
const School = require('../../../database/models/School');
const teacherRepository = require('../../school/repositories/teacher.repository');

// Cross-school teacher management for the superadmin panel. The school-side
// teacher.service.js scopes every query to one schoolId (a school admin only
// manages their own staff); these mirror that service's shape but drop the
// schoolId constraint so a superadmin can see and manage every teacher.
const teacherManagementService = {
  async listTeachers(query = {}) {
    const filter = {};
    if (query.schoolId) filter.schoolId = query.schoolId;
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;

    const { data, pagination } = await teacherRepository.findWithUsers(filter, query);

    const schoolIds = [...new Set(data.map((t) => String(t.schoolId)).filter(Boolean))];
    const schools = schoolIds.length
      ? await School.find({ _id: { $in: schoolIds } }).select('name schoolRefNo').lean()
      : [];
    const schoolById = new Map(schools.map((s) => [String(s._id), s]));

    return {
      data: data.map((teacher) => ({
        ...teacher,
        school: schoolById.get(String(teacher.schoolId)) || null,
      })),
      pagination,
    };
  },

  async getTeacher(teacherId) {
    const profile = await TeacherProfile.findById(teacherId).lean();
    if (!profile) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
    const [user, school] = await Promise.all([
      User.findById(profile.userId).lean(),
      profile.schoolId ? School.findById(profile.schoolId).select('name schoolRefNo').lean() : null,
    ]);
    return { ...profile, user, school };
  },

  async updateTeacher(teacherId, payload = {}) {
    const { user, ...profileData } = payload;
    const profile = await TeacherProfile.findById(teacherId);
    if (!profile) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    if (user) {
      const userUpdates = { ...user };
      if (userUpdates.avatarUrl !== undefined) {
        profileData.avatarUrl = userUpdates.avatarUrl;
        delete userUpdates.avatarUrl;
      }
      if (userUpdates.phone) {
        const normPhone = normalizePhone(userUpdates.phone);
        const existingPhone = await User.findOne({
          _id: { $ne: profile.userId },
          phone: normPhone,
          'softDelete.isDeleted': { $ne: true },
        });
        if (existingPhone) {
          throw new ConflictError('A user with this phone number already exists', 'PHONE_EXISTS');
        }
        userUpdates.phone = normPhone;
      }
      if (userUpdates.email) {
        const normEmail = userUpdates.email.trim().toLowerCase();
        const emailOwner = await User.findEmailOwner(normEmail, { excludeUserId: profile.userId });
        if (emailOwner) {
          throw new ConflictError(`Email already belongs to another account (${emailOwner.name})`, 'EMAIL_EXISTS');
        }
        userUpdates.email = normEmail;
      }
      if (Object.keys(userUpdates).length > 0) {
        await User.findByIdAndUpdate(profile.userId, { $set: userUpdates }, { runValidators: true });
      }
    }

    if (Object.keys(profileData).length > 0) {
      await TeacherProfile.findByIdAndUpdate(teacherId, { $set: profileData }, { runValidators: true });
    }

    return this.getTeacher(teacherId);
  },

  // Hard delete — same three operations teacher.service.js#deleteTeacher
  // already performs for a school admin's own staff, just without the
  // schoolId constraint (a superadmin can remove any teacher).
  async deleteTeacher(teacherId, actor = {}) {
    const profile = await TeacherProfile.findById(teacherId);
    if (!profile) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    await runAtomic(async (session) => {
      await TeacherProfile.deleteOne({ _id: teacherId }).session(session);
      await User.deleteOne({ _id: profile.userId }).session(session);
      await SchoolMembership.deleteMany({ userId: profile.userId, schoolId: profile.schoolId, role: 'teacher' }).session(session);
    });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'teacher.deleted_by_admin',
      entityType: 'TeacherProfile',
      entityId: teacherId,
      after: { schoolId: profile.schoolId, userId: profile.userId },
    });

    return { success: true };
  },
};

module.exports = teacherManagementService;
