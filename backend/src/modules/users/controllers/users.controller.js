const usersService = require('../services/users.service');
const { success } = require('../../../common/response');
const asyncHandler = require('../../../utils/asyncHandler');

const usersController = {
  me: asyncHandler(async (req, res) => {
    const profile = await usersService.getProfile(req.auth.userId);
    return success(res, profile, 'Profile fetched successfully', undefined, req);
  }),

  update: asyncHandler(async (req, res) => {
    const profile = await usersService.updateProfile(req.auth.userId, req.body);
    return success(res, profile, 'Profile updated successfully', undefined, req);
  }),

  setActiveChild: asyncHandler(async (req, res) => {
    const profile = await usersService.setActiveChild(req.auth.userId, req.body.childProfileId);
    return success(res, profile, 'Active child updated', undefined, req);
  }),

  getSocialRewardStatus: asyncHandler(async (req, res) => {
    const socialRewardService = require('../../admin/services/socialReward.service');
    const userId = req.auth?.userId;
    if (!userId) {
      const config = await socialRewardService.getConfig();
      return success(
        res,
        {
          isActive: Boolean(config?.isActive),
          discountPercent: config?.discountPercent || 5,
          hasLifetimeSocialDiscount: false,
          urls: {
            instagram: config?.instagramUrl,
            youtube: config?.youtubeUrl,
            google: config?.googleReviewUrl,
          },
          request: null,
          isGuest: true,
        },
        'Social reward status fetched',
        undefined,
        req
      );
    }
    const data = await socialRewardService.getParentStatus(userId);
    return success(res, data, 'Social reward status fetched', undefined, req);
  }),

  completeSocialRewardTask: asyncHandler(async (req, res) => {
    const socialRewardService = require('../../admin/services/socialReward.service');
    const request = await socialRewardService.completeTask(req.auth.userId, req.body.platform);
    return success(res, { request }, 'Task completed', undefined, req);
  }),

  submitSocialRewardForApproval: asyncHandler(async (req, res) => {
    const socialRewardService = require('../../admin/services/socialReward.service');
    const request = await socialRewardService.submitForApproval(req.auth.userId);
    return success(res, { request }, 'Request submitted for admin approval', undefined, req);
  }),
};

module.exports = usersController;
