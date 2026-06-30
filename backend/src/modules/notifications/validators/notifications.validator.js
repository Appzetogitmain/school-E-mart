const Joi = require('joi');

const registerTokenSchema = Joi.object({
  token: Joi.string().trim().min(20).required(),
  platform: Joi.string().valid('web', 'app').default('web'),
});

const unregisterTokenSchema = Joi.object({
  token: Joi.string().trim().required(),
});

const listNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  unreadOnly: Joi.boolean().truthy('true').falsy('false').default(false),
});

const notificationIdParamsSchema = Joi.object({
  notificationId: Joi.string().hex().length(24).required(),
});

module.exports = {
  registerTokenSchema,
  unregisterTokenSchema,
  listNotificationsSchema,
  notificationIdParamsSchema,
};
