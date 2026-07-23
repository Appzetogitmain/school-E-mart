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
};

module.exports = usersController;
