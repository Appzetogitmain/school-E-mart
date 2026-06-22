const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const { withTransaction } = require('../../../database');
const { hashPassword } = require('../../../utils');
const User = require('../../../database/models/User');
const teacherRepository = require('../repositories/teacher.repository');
const membershipRepository = require('../repositories/membership.repository');
const schoolRepository = require('../repositories/school.repository');
const { generateUserRefId } = require('../utils/refId');

const teacherService = {
  async createTeacher(schoolId, payload) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    return withTransaction(async (session) => {
      const { hash, algo } = await hashPassword(payload.password);
      const refId = generateUserRefId('TCH');

      const [user] = await User.create(
        [
          {
            refId,
            role: 'teacher',
            status: payload.autoApprove ? 'active' : 'pending_approval',
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            passwordHash: hash,
            passwordAlgo: algo,
            tenantSchoolId: schoolId,
          },
        ],
        { session }
      );

      const profile = await teacherRepository.create(
        {
          userId: user._id,
          schoolId,
          employeeId: payload.employeeId,
          designation: payload.designation,
          department: payload.department,
          qualification: payload.qualification,
          experienceYears: payload.experienceYears,
          joiningDate: payload.joiningDate,
          subjectsTaught: payload.subjectsTaught || [],
          classAssignments: payload.classAssignments || [],
          approvalStatus: payload.autoApprove ? 'approved' : 'pending',
          approvedAt: payload.autoApprove ? new Date() : null,
        },
        { session }
      );

      await membershipRepository.create(
        {
          userId: user._id,
          schoolId,
          role: 'teacher',
          status: payload.autoApprove ? 'approved' : 'pending',
        },
        { session }
      );

      return { user, profile };
    });
  },

  async listTeachers(schoolId, query, { approvalStatus } = {}) {
    const filter = { schoolId };
    if (approvalStatus) filter.approvalStatus = approvalStatus;
    return teacherRepository.findWithUsers(filter, query);
  },

  async getTeacher(schoolId, teacherProfileId) {
    const profile = await teacherRepository.findOne({ _id: teacherProfileId, schoolId });
    if (!profile) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
    const user = await User.findById(profile.userId).lean();
    return { ...profile, user };
  },

  async updateTeacher(schoolId, teacherProfileId, payload) {
    const { user, ...profileData } = payload;
    const profile = await teacherRepository.updateById(
      teacherProfileId,
      { $set: profileData },
      { schoolId }
    );
    if (!profile) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    if (user) {
      await User.findByIdAndUpdate(profile.userId, { $set: user }, { runValidators: true });
    }
    return this.getTeacher(schoolId, teacherProfileId);
  },

  async setTeacherStatus(schoolId, teacherProfileId, { approvalStatus, approvedBy, rejectionReason }) {
    const update = { approvalStatus };
    if (approvalStatus === 'approved') {
      update.approvedAt = new Date();
      update.approvedBy = approvedBy;
    }

    const profile = await teacherRepository.updateById(teacherProfileId, { $set: update }, { schoolId });
    if (!profile) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    const userStatus = approvalStatus === 'approved' ? 'active' : approvalStatus === 'rejected' ? 'inactive' : 'pending_approval';
    await User.findByIdAndUpdate(profile.userId, { $set: { status: userStatus } });
    const membership = await membershipRepository.findByUserSchoolRole(profile.userId, schoolId, 'teacher');
    if (membership) {
      await membershipRepository.updateById(membership._id, {
        $set: { status: approvalStatus === 'approved' ? 'approved' : approvalStatus },
      });
    }

    return this.getTeacher(schoolId, teacherProfileId);
  },

  async assignTeacherToSchool(schoolId, teacherProfileId) {
    const profile = await teacherRepository.updateById(
      teacherProfileId,
      { $set: { schoolId } },
      { schoolId }
    );
    if (!profile) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');
    await User.findByIdAndUpdate(profile.userId, { $set: { tenantSchoolId: schoolId } });
    return profile;
  },
};

module.exports = teacherService;
