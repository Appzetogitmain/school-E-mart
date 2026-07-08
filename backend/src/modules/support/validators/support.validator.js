const { Joi, schemas } = require('../../../common/validation');

const objectId = schemas.objectId;

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string()
    .valid('open', 'pending_customer', 'pending_internal', 'resolved', 'closed')
    .optional(),
});

const topicsQuery = Joi.object({
  audience: Joi.string().valid('parent', 'school', 'vendor', 'general').optional(),
});

const ticketIdParam = Joi.object({ ticketId: Joi.string().trim().required() });

const createTicketSchema = Joi.object({
  topicId: objectId.required(),
  subject: Joi.string().trim().min(2).max(150).required(),
  body: Joi.string().trim().min(2).max(2000).required(),
  reference: Joi.object({
    kind: Joi.string().valid('Order', 'Product', 'VendorProfile').optional(),
    id: objectId.optional(),
  }).optional(),
});

const replySchema = Joi.object({
  body: Joi.string().trim().min(1).max(2000).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('open', 'pending_customer', 'pending_internal', 'resolved', 'closed')
    .required(),
  assignedTo: objectId.optional(),
});

module.exports = {
  paginationQuery,
  topicsQuery,
  ticketIdParam,
  createTicketSchema,
  replySchema,
  updateStatusSchema,
};
