const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const { withTransaction } = require('../../../database');
const { hashPassword } = require('../../../utils');
const User = require('../../../database/models/User');
const TeacherProfile = require('../../../database/models/TeacherProfile');
const SchoolMembership = require('../../../database/models/SchoolMembership');
const teacherRepository = require('../repositories/teacher.repository');
const membershipRepository = require('../repositories/membership.repository');
const schoolRepository = require('../repositories/school.repository');
const classService = require('./class.service');
const { generateUserRefId } = require('../utils/refId');

const teacherService = {
  async createTeacher(schoolId, payload) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const existingPhone = await User.findOne({ phone: payload.phone, 'softDelete.isDeleted': { $ne: true } });
    if (existingPhone) {
      throw new ConflictError('A user with this phone number already exists', 'PHONE_EXISTS');
    }
    const emailOwner = await User.findEmailOwner(payload.email);
    if (emailOwner) {
      throw new ConflictError(
        `That email address already belongs to another account (${emailOwner.name}, ${emailOwner.role})`,
        'EMAIL_EXISTS'
      );
    }

    const result = await withTransaction(async (session) => {
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

      if (payload.classAssignments?.length) {
        await classService.syncAssignmentsToSchoolConfig(schoolId, payload.classAssignments);
      }

      return { user, profile };
    });

    if (result.user && result.user.email) {
      const emailService = require('../../../common/email');
      const logger = require('../../../common/logger');
      emailService.sendWelcomeEmail({
        to: result.user.email,
        name: result.user.name,
        role: 'teacher',
        mobile: result.user.phone,
        password: payload.password,
        schoolName: school.name,
      }).catch((err) => {
        logger.error('Failed to send teacher welcome email:', err);
      });
    }

    return result;
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

  async getTeacherByUserId(schoolId, userId) {
    const profile = await teacherRepository.findOne({
      userId,
      schoolId,
      'softDelete.isDeleted': { $ne: true },
    });
    if (!profile) throw new NotFoundError('Teacher profile not found', 'TEACHER_PROFILE_NOT_FOUND');
    const user = await User.findById(profile.userId).lean();
    return { ...profile, user };
  },

  async updateTeacher(schoolId, teacherProfileId, payload) {
    const { user, ...profileData } = payload;
    const profile = await teacherRepository.findOne({ _id: teacherProfileId, schoolId });
    if (!profile) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    if (user) {
      const userUpdates = { ...user };
      if (userUpdates.avatarUrl !== undefined) {
        profileData.avatarUrl = userUpdates.avatarUrl;
        delete userUpdates.avatarUrl;
      }
      if (userUpdates.phone) {
        const { normalizePhone } = require('../../../utils');
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
      await teacherRepository.updateById(
        teacherProfileId,
        { $set: profileData },
        { schoolId }
      );
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

  async deleteTeacher(schoolId, teacherProfileId) {
    const profile = await TeacherProfile.findOne({ _id: teacherProfileId, schoolId });
    if (!profile) throw new NotFoundError('Teacher profile not found', 'TEACHER_NOT_FOUND');

    const user = await User.findOne({ _id: profile.userId, tenantSchoolId: schoolId });
    if (!user) throw new NotFoundError('Teacher user not found under this school', 'TEACHER_NOT_FOUND');

    await withTransaction(async (session) => {
      await TeacherProfile.deleteOne({ _id: teacherProfileId }).session(session);
      await User.deleteOne({ _id: profile.userId }).session(session);
      await SchoolMembership.deleteMany({ userId: profile.userId, schoolId, role: 'teacher' }).session(session);
    });

    return { success: true };
  },
};

module.exports = teacherService;
