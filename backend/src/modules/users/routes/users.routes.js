const express = require('express');
const usersController = require('../controllers/users.controller');
const validators = require('../validators/users.validator');
const { validateBody } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');

const router = express.Router();

router.get('/me', ...protectedRoute(), usersController.me);
router.patch('/me', ...protectedRoute(), validateBody(validators.updateProfileSchema), usersController.update);

module.exports = router;
