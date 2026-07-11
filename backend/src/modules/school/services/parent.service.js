const { NotFoundError } = require('../../../common/errors');
const { withTransaction } = require('../../../database');
const User = require('../../../database/models/User');
const ParentProfile = require('../../../database/models/ParentProfile');
const { normalizePhone } = require('../../../utils');

// Parent accounts are no longer created here — they are created automatically
// by student.service's linkParentByPhone when a student is enrolled.
const parentService = {
  async listParents(schoolId, query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {
      role: 'parent',
      tenantSchoolId: schoolId,
      'softDelete.isDeleted': { $ne: true },
    };

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
      ];
    }

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ 'audit.createdAt': -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Populate ParentProfile details and linked children so the (view-only)
    // parents directory can show who each account belongs to
    const ChildProfile = require('../../../database/models/ChildProfile');
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
    const user = await User.findOne({ _id: profile.userId, tenantSchoolId: schoolId, 'softDelete.isDeleted': { $ne: true } }).lean();
    if (!user) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');
    return { ...profile, user };
  },

  async updateParent(schoolId, parentId, payload) {
    const profile = await ParentProfile.findOne({ _id: parentId, 'softDelete.isDeleted': { $ne: true } });
    if (!profile) throw new NotFoundError('Parent not found', 'PARENT_NOT_FOUND');
    const user = await User.findOne({ _id: profile.userId, tenantSchoolId: schoolId, 'softDelete.isDeleted': { $ne: true } });
    if (!user) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');

    if (payload.name) user.name = payload.name;
    if (payload.email !== undefined) user.email = payload.email || undefined;
    if (payload.phone) user.phone = normalizePhone(payload.phone);

    await user.save();
    return { ...profile.toObject(), user: user.toObject() };
  },

  async deleteParent(schoolId, parentId) {
    const profile = await ParentProfile.findOne({ _id: parentId });
    if (!profile) throw new NotFoundError('Parent not found', 'PARENT_NOT_FOUND');
    const user = await User.findOne({ _id: profile.userId, tenantSchoolId: schoolId });
    if (!user) throw new NotFoundError('Parent not found under this school', 'PARENT_NOT_FOUND');

    const Student = require('../../../database/models/Student');
    const ChildProfile = require('../../../database/models/ChildProfile');

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
