const { success, paginated } = require('../../../common/response');
const asyncHandler = require('../../../utils/asyncHandler');
const tutorialsService = require('../../admin/services/tutorials.service');

const contentController = {
  // GET /content/tutorials — "Learn more about platform" videos for the
  // signed-in user's role (parent/student, teacher, or school), plus any
  // videos the admin targeted at "all" roles.
  listTutorials: asyncHandler(async (req, res) => {
    const { data, pagination } = await tutorialsService.listForAudience(req.auth.role, req.query);
    return paginated(res, { tutorials: data }, pagination, 'Tutorials fetched', req);
  }),

  recordTutorialView: asyncHandler(async (req, res) => {
    const tutorial = await tutorialsService.recordView(req.params.tutorialId);
    return success(res, { tutorial }, 'View recorded', undefined, req);
  }),
};

module.exports = contentController;
