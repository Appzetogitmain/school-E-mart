const { Joi, schemas } = require('../../../common/validation');

const objectId = schemas.objectId;

const tutorialQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
});

const tutorialIdParam = Joi.object({ tutorialId: objectId.required() });

module.exports = {
  tutorialQuery,
  tutorialIdParam,
};
