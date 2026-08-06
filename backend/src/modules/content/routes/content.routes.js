const express = require('express');
const contentController = require('../controllers/content.controller');
const validators = require('../validators/content.validator');
const { validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { ROLES } = require('../../../constants/roles');

const router = express.Router();

// "Learn more about platform" is available to every signed-in portal user —
// parent/student, teacher, and school admin — each seeing videos targeted at
// their role plus any targeted at "all".
const learnerOnly = protectedRoute({
  roles: [ROLES.PARENT, ROLES.TEACHER, ROLES.SCHOOL_ADMIN],
});

router.get('/tutorials', ...learnerOnly, validateQuery(validators.tutorialQuery), contentController.listTutorials);
router.post(
  '/tutorials/:tutorialId/view',
  ...learnerOnly,
  validateParams(validators.tutorialIdParam),
  contentController.recordTutorialView
);

module.exports = router;
