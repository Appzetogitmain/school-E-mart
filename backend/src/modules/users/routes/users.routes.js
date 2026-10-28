const express = require('express');
const usersController = require('../controllers/users.controller');
const validators = require('../validators/users.validator');
const { validateBody } = require('../../../middlewares/validation');
const { protectedRoute, optionalAuthRoute } = require('../../../middlewares/auth/guards');

const router = express.Router();

router.get('/me', ...protectedRoute(), usersController.me);
router.patch('/me', ...protectedRoute(), validateBody(validators.updateProfileSchema), usersController.update);
router.post(
  '/me/active-child',
  ...protectedRoute(),
  validateBody(validators.setActiveChildSchema),
  usersController.setActiveChild
);

// Social Privilege Reward Program
router.get('/social-reward/status', ...optionalAuthRoute(), usersController.getSocialRewardStatus);
router.post('/social-reward/task', ...protectedRoute(), usersController.completeSocialRewardTask);
router.post('/social-reward/submit', ...protectedRoute(), usersController.submitSocialRewardForApproval);

module.exports = router;
