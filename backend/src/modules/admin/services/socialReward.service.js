const mongoose = require('mongoose');
const SocialRewardConfig = require('../../../database/models/SocialRewardConfig');
const SocialRewardRequest = require('../../../database/models/SocialRewardRequest');
const User = require('../../../database/models/User');
const ParentProfile = require('../../../database/models/ParentProfile');
const Student = require('../../../database/models/Student');
const School = require('../../../database/models/School');
const { NotFoundError, BadRequestError } = require('../../../common/errors');

const socialRewardService = {
  async getConfig() {
    let config = await SocialRewardConfig.findById('default').lean();
    if (!config) {
      config = await SocialRewardConfig.create({
        _id: 'default',
        isActive: true,
        discountPercent: 5,
        instagramUrl: 'https://www.instagram.com/schoolemart',
        youtubeUrl: 'https://www.youtube.com/@schoolemart',
        googleReviewUrl: 'https://g.page/r/schoolemart/review',
      });
      config = config.toObject();
    }
    return config;
  },

  async updateConfig(payload, actor) {
    const update = {
      updatedBy: actor?.userId || 'system',
      updatedAt: new Date(),
    };
    if (typeof payload.isActive === 'boolean') update.isActive = payload.isActive;
    if (payload.discountPercent != null) update.discountPercent = Number(payload.discountPercent);
    if (payload.instagramUrl != null) update.instagramUrl = payload.instagramUrl.trim();
    if (payload.youtubeUrl != null) update.youtubeUrl = payload.youtubeUrl.trim();
    if (payload.googleReviewUrl != null) update.googleReviewUrl = payload.googleReviewUrl.trim();

    const config = await SocialRewardConfig.findByIdAndUpdate('default', update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }).lean();

    return config;
  },

  async getAdminRequests({ page = 1, limit = 20, status, search }) {
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ customerName: regex }, { phone: regex }, { schoolName: regex }];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const [requests, total] = await Promise.all([
      SocialRewardRequest.find(filter)
        .sort({ submittedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      SocialRewardRequest.countDocuments(filter),
    ]);

    return {
      requests,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    };
  },

  async approveRequest(requestId, adminId) {
    const request = await SocialRewardRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Social reward request not found');
    }

    request.status = 'approved';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    await User.findByIdAndUpdate(request.userId, {
      hasLifetimeSocialDiscount: true,
    });

    return request.toObject();
  },

  async rejectRequest(requestId, adminId, reason = '') {
    const request = await SocialRewardRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Social reward request not found');
    }

    request.status = 'rejected';
    request.rejectionReason = reason || 'Requirements not verified';
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    await request.save();

    await User.findByIdAndUpdate(request.userId, {
      hasLifetimeSocialDiscount: false,
    });

    return request.toObject();
  },

  // -------------------------------------------------------------
  // Parent Facing Methods
  // -------------------------------------------------------------
  async getParentStatus(userId) {
    const [config, user, request] = await Promise.all([
      this.getConfig(),
      User.findById(userId).select('name phone hasLifetimeSocialDiscount').lean(),
      SocialRewardRequest.findOne({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!config.isActive) {
      return {
        isActive: false,
        discountPercent: config.discountPercent || 5,
        hasLifetimeSocialDiscount: false,
        request: null,
      };
    }

    return {
      isActive: true,
      discountPercent: config.discountPercent || 5,
      hasLifetimeSocialDiscount: Boolean(user?.hasLifetimeSocialDiscount),
      urls: {
        instagram: config.instagramUrl,
        youtube: config.youtubeUrl,
        google: config.googleReviewUrl,
      },
      request: request || {
        tasks: { instagram: false, youtube: false, google: false },
        status: 'not_started',
      },
    };
  },

  async completeTask(userId, platform) {
    const allowed = ['instagram', 'youtube', 'google'];
    if (!allowed.includes(platform)) {
      throw new BadRequestError('Invalid platform task');
    }

    const config = await this.getConfig();
    if (!config.isActive) {
      throw new BadRequestError('Social reward program is currently disabled');
    }

    let request = await SocialRewardRequest.findOne({ userId, status: { $ne: 'approved' } });
    if (!request) {
      const user = await User.findById(userId).lean();
      if (!user) throw new NotFoundError('User not found');

      const parentProfile = await ParentProfile.findOne({ userId }).lean();
      let studentName = '';
      let schoolName = '';
      let schoolId = null;

      if (parentProfile) {
        const student = await Student.findOne({ parentProfileIds: parentProfile._id }).lean();
        if (student) {
          studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
          schoolId = student.schoolId;
        }
      }
      if (schoolId) {
        const school = await School.findById(schoolId).lean();
        schoolName = school?.name || '';
      }

      request = new SocialRewardRequest({
        userId,
        parentProfileId: parentProfile?._id,
        customerName: user.name || 'Parent',
        phone: user.phone,
        schoolId,
        schoolName,
        studentName,
        tasks: { instagram: false, youtube: false, google: false },
        status: 'in_progress',
      });
    }

    request.tasks[platform] = true;
    await request.save();

    return request.toObject();
  },

  async submitForApproval(userId) {
    const config = await this.getConfig();
    if (!config.isActive) {
      throw new BadRequestError('Social reward program is currently disabled');
    }

    const request = await SocialRewardRequest.findOne({ userId, status: { $in: ['in_progress', 'rejected'] } });
    if (!request) {
      const existingApproved = await SocialRewardRequest.findOne({ userId, status: 'approved' });
      if (existingApproved) {
        return existingApproved.toObject();
      }
      throw new BadRequestError('No tasks started yet');
    }

    if (!request.tasks.instagram || !request.tasks.youtube || !request.tasks.google) {
      throw new BadRequestError('All 3 tasks (Instagram, YouTube, Google) must be completed before submitting');
    }

    request.status = 'pending_approval';
    request.submittedAt = new Date();
    await request.save();

    return request.toObject();
  },
};

module.exports = socialRewardService;
