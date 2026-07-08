const { NotFoundError, ConflictError } = require('../../../common/errors');
const { withTransaction } = require('../../../database');
const User = require('../../../database/models/User');
const ParentProfile = require('../../../database/models/ParentProfile');
const schoolRepository = require('../repositories/school.repository');
const { generateUserRefId } = require('../utils/refId');
const { normalizePhone } = require('../../../utils');

const parentService = {
  async createParent(schoolId, payload) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const normalizedPhone = normalizePhone(payload.phone);
    
    const existingPhone = await User.findOne({ phone: normalizedPhone, 'softDelete.isDeleted': { $ne: true } });
    if (existingPhone) {
      throw new ConflictError('A user with this phone number already exists', 'PHONE_EXISTS');
    }

    if (payload.email) {
      const existingEmail = await User.findOne({ email: payload.email.toLowerCase(), 'softDelete.isDeleted': { $ne: true } });
      if (existingEmail) {
        throw new ConflictError('A user with this email address already exists', 'EMAIL_EXISTS');
      }
    }

    const result = await withTransaction(async (session) => {
      const refId = generateUserRefId('P');
      
      const [user] = await User.create([{
        refId,
        role: 'parent',
        status: 'active',
        name: payload.name,
        email: payload.email || undefined,
        phone: normalizedPhone,
        phoneVerifiedAt: new Date(),
        tenantSchoolId: schoolId,
      }], { session });

      // Generate a unique referralCode (format EMARTxxxx)
      let referralCode;
      let isUnique = false;
      while (!isUnique) {
        const rand = Math.floor(1000 + Math.random() * 9000); // 4 digits
        referralCode = `EMART${rand}`;
        const match = await ParentProfile.findOne({ referralCode }).session(session);
        if (!match) isUnique = true;
      }

      const [profile] = await ParentProfile.create([{
        userId: user._id,
        referralCode,
      }], { session });

      return { user, profile };
    });

    // Send Welcome Email
    if (payload.email) {
      const emailService = require('../../../common/email');
      const logger = require('../../../common/logger');
      emailService.sendWelcomeEmail({
        to: payload.email,
        name: payload.name,
        role: 'parent',
        mobile: normalizedPhone,
        schoolName: school.name,
      }).catch((err) => {
        logger.error('Failed to send parent welcome email:', err);
      });
    }

    return result;
  },

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

    // Populate ParentProfile details
    const populated = await Promise.all(users.map(async (user) => {
      const profile = await ParentProfile.findOne({ userId: user._id, 'softDelete.isDeleted': { $ne: true } }).lean();
      return {
        ...profile,
        user,
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

    await withTransaction(async (session) => {
      await ParentProfile.deleteOne({ _id: parentId }).session(session);
      await User.deleteOne({ _id: profile.userId }).session(session);
    });

    return { success: true };
  }
};

module.exports = parentService;
