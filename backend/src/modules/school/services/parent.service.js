const { NotFoundError, BadRequestError } = require('../../../common/errors');
const { withTransaction } = require('../../../database');
const User = require('../../../database/models/User');
const ParentProfile = require('../../../database/models/ParentProfile');
const School = require('../../../database/models/School');
const emailService = require('../../../common/email');
const logger = require('../../../common/logger');
const { normalizePhone } = require('../../../utils');

// Parent accounts are no longer created here — they are created automatically
// by student.service's linkParentByPhone when a student is enrolled.
const parentService = {
  async listParents(schoolId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const ChildProfile = require('../../../database/models/ChildProfile');
    const parentUserIds = await ChildProfile.find({
      schoolId,
      'softDelete.isDeleted': { $ne: true }
    }).distinct('parentUserId');

    const filter = {
      role: 'parent',
      'softDelete.isDeleted': { $ne: true },
      $or: [
        { tenantSchoolId: schoolId },
        { _id: { $in: parentUserIds } }
      ]
    };

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$and = [
        {
          $or: [
            { tenantSchoolId: schoolId },
            { _id: { $in: parentUserIds } }
          ]
        },
        {
          $or: [
            { name: searchRegex },
            { phone: searchRegex },
            { email: searchRegex },
          ]
        }
      ];
      delete filter.$or;
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ 'audit.createdAt': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Populate ParentProfile details and linked children so the (view-only)
    // parents directory can show who each account belongs to
    const populated = await Promise.all(users.map(async (user) => {
      const profile = await ParentProfile.findOne({ userId: user._id, 'softDelete.isDeleted': { $ne: true } }).lean();
      const children = await ChildProfile.find({
        parentUserId: user._id,
        'softDelete.isDeleted': { $ne: true },
      }).select('name grade rollNo studentId').lean();
      return {
        ...profile,
        user,
        children,
      };
    }));

    return {
      data: populated,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  async getParent(schoolId, parentId) {
    const profile = await ParentProfile.findOne({ _id: parentId, 'softDelete.isDeleted': { $ne: true } }).lean();
    if (!profile) throw new NotFoundError('Parent not found', 'PARENT_NOT_FOUND');
    const user = await User.findOne({ _id: profile.userId, 'softDelete.isDeleted': { $ne: true } }).lean();
    if (!user) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');

    const ChildProfile = require('../../../database/models/ChildProfile');
    const hasAccess = user.tenantSchoolId?.toString() === schoolId.toString() ||
                      await ChildProfile.exists({ parentUserId: user._id, schoolId, 'softDelete.isDeleted': { $ne: true } });
    if (!hasAccess) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');

    return { ...profile, user };
  },

  async updateParent(schoolId, parentId, payload) {
    const profile = await ParentProfile.findOne({ _id: parentId, 'softDelete.isDeleted': { $ne: true } });
    if (!profile) throw new NotFoundError('Parent not found', 'PARENT_NOT_FOUND');
    const user = await User.findOne({ _id: profile.userId, 'softDelete.isDeleted': { $ne: true } });
    if (!user) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');

    const ChildProfile = require('../../../database/models/ChildProfile');
    const hasAccess = user.tenantSchoolId?.toString() === schoolId.toString() ||
                      await ChildProfile.exists({ parentUserId: user._id, schoolId, 'softDelete.isDeleted': { $ne: true } });
    if (!hasAccess) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');

    if (payload.name) user.name = payload.name;
    if (payload.email !== undefined) user.email = payload.email || undefined;
    if (payload.phone) user.phone = normalizePhone(payload.phone);

    await user.save();
    return { ...profile.toObject(), user: user.toObject() };
  },

  /**
   * Re-send the "your account is ready" mail to a parent. The original is sent once,
   * at enrollment; schools need to be able to send it again on demand (parent lost it,
   * email added later, etc). Awaited rather than fire-and-forget so the school gets a
   * real success/failure back.
   */
  async resendWelcomeEmail(schoolId, parentId) {
    const parent = await this.getParent(schoolId, parentId);
    const { user } = parent;

    if (!user.email) {
      throw new BadRequestError(
        'This parent has no email address on record',
        null,
        'PARENT_EMAIL_MISSING'
      );
    }

    const school = await School.findById(schoolId).select('name').lean();

    await emailService.sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: 'parent',
      mobile: user.phone,
      schoolName: school?.name || '',
    });

    return { sent: true, email: user.email, name: user.name };
  },

  /** Send to many parents at once; one bad address must not sink the rest. */
  async resendWelcomeEmailBulk(schoolId, parentIds) {
    const results = await Promise.allSettled(
      parentIds.map((parentId) => this.resendWelcomeEmail(schoolId, parentId))
    );

    const sent = [];
    const failed = [];
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        sent.push(result.value.email);
      } else {
        failed.push({
          parentId: parentIds[index],
          reason: result.reason?.message || 'Failed to send',
        });
        logger.error('Failed to resend parent welcome email', {
          parentId: parentIds[index],
          message: result.reason?.message,
        });
      }
    });

    return { sentCount: sent.length, failedCount: failed.length, sent, failed };
  },

  async deleteParent(schoolId, parentId) {
    const profile = await ParentProfile.findOne({ _id: parentId });
    if (!profile) throw new NotFoundError('Parent not found', 'PARENT_NOT_FOUND');
    const user = await User.findOne({ _id: profile.userId });
    if (!user) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');

    const ChildProfile = require('../../../database/models/ChildProfile');
    const hasAccess = user.tenantSchoolId?.toString() === schoolId.toString() ||
                      await ChildProfile.exists({ parentUserId: user._id, schoolId });
    if (!hasAccess) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');

    const Student = require('../../../database/models/Student');

    await withTransaction(async (session) => {
      // Remove references first so students and child profiles don't keep
      // dangling links to the deleted parent
      await Student.updateMany(
        { parentProfileIds: parentId },
        { $pull: { parentProfileIds: parentId } }
      ).session(session);
      await ChildProfile.deleteMany({ parentUserId: profile.userId }).session(session);
      await ParentProfile.deleteOne({ _id: parentId }).session(session);
      await User.deleteOne({ _id: profile.userId }).session(session);
    });

    return { success: true };
  }
};

module.exports = parentService;
