const { Joi, schemas } = require('../../../common/validation');

const objectId = schemas.objectId;

const schoolIdParam = Joi.object({ schoolId: objectId.required() });
const eventIdParam = Joi.object({ schoolId: objectId.required(), eventId: objectId.required() });
const entryIdParam = Joi.object({ schoolId: objectId.required(), entryId: objectId.required() });
const kitIdParam = Joi.object({ schoolId: objectId.required(), kitId: objectId.required() });

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().trim().optional(),
  search: Joi.string().trim().max(120).optional(),
  status: Joi.string().trim().optional(),
  eventType: Joi.string().trim().optional(),
  classGrade: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  department: Joi.string().trim().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

const targetClassSchema = Joi.object({
  classGrade: Joi.string().trim().required(),
  sections: Joi.array().items(Joi.string().trim()).default([]),
});

const createEventSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(2000).optional().allow('', null),
  eventType: Joi.string().trim().max(60).required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  location: Joi.string().trim().max(200).optional().allow('', null),
  targetAudience: Joi.string()
    .valid('all', 'parents', 'teachers', 'students', 'specific_classes')
    .default('all'),
  targetClasses: Joi.array().items(targetClassSchema).optional(),
});

const updateEventSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).optional(),
  description: Joi.string().trim().max(2000).optional().allow('', null),
  eventType: Joi.string().trim().max(60).optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  location: Joi.string().trim().max(200).optional().allow('', null),
  targetAudience: Joi.string()
    .valid('all', 'parents', 'teachers', 'students', 'specific_classes')
    .optional(),
  targetClasses: Joi.array().items(targetClassSchema).optional(),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').optional(),
}).min(1);

const phonebookEntrySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  designation: Joi.string().trim().max(100).required(),
  department: Joi.string().trim().max(100).optional().allow('', null),
  email: Joi.string().email().optional().allow('', null),
  phone: Joi.string().trim().max(20).required(),
  availabilityHours: Joi.string().trim().max(100).optional().allow('', null),
  displayOrder: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('active', 'inactive').optional(),
});

const updatePhonebookSchema = phonebookEntrySchema.fork(
  ['name', 'designation', 'phone'],
  (schema) => schema.optional()
).min(1);

const kitItemSchema = Joi.object({
  productId: objectId.required(),
  qty: Joi.number().integer().min(1).required(),
  optional: Joi.boolean().optional(),
});

const createKitSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  // The vendor the school picks to supply and fulfil the kit. Optional while a
  // kit is a draft; required before it can go live (enforced in the service).
  vendorId: objectId.optional().allow(null),
  classGrade: Joi.string().trim().max(30).optional().allow('', null),
  category: Joi.string().trim().max(60).optional().allow('', null),
  description: Joi.string().trim().max(2000).optional().allow('', null),
  imageId: objectId.optional().allow(null),
  items: Joi.array().items(kitItemSchema).min(1).required(),
  addOns: Joi.array().items(kitItemSchema).optional(),
  pricePaise: Joi.number().integer().min(0).optional(),
  mrpPaise: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('active', 'draft').optional(),
  showOnApp: Joi.boolean().optional(),
  availableOnline: Joi.boolean().optional(),
  allowPreorders: Joi.boolean().optional(),
});

const updateKitSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).optional(),
  vendorId: objectId.optional().allow(null),
  classGrade: Joi.string().trim().max(30).optional().allow('', null),
  category: Joi.string().trim().max(60).optional().allow('', null),
  description: Joi.string().trim().max(2000).optional().allow('', null),
  imageId: objectId.optional().allow(null),
  items: Joi.array().items(kitItemSchema).min(1).optional(),
  addOns: Joi.array().items(kitItemSchema).optional(),
  pricePaise: Joi.number().integer().min(0).optional(),
  mrpPaise: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('active', 'draft').optional(),
  flags: Joi.object({
    showOnApp: Joi.boolean().optional(),
    availableOnline: Joi.boolean().optional(),
    allowPreorders: Joi.boolean().optional(),
  }).optional(),
}).min(1);

module.exports = {
  schoolIdParam,
  eventIdParam,
  entryIdParam,
  kitIdParam,
  paginationQuery,
  createEventSchema,
  updateEventSchema,
  phonebookEntrySchema,
  updatePhonebookSchema,
  createKitSchema,
  updateKitSchema,
};
