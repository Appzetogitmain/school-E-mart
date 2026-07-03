const { Joi, schemas } = require('../../../common/validation');

const uniformSetSchema = Joi.object({
  name: Joi.string().trim().max(120).required(),
  type: Joi.string().trim().max(60).optional(),
  boysQty: Joi.alternatives().try(Joi.number().min(0), Joi.string().trim()).optional(),
  girlsQty: Joi.alternatives().try(Joi.number().min(0), Joi.string().trim()).optional(),
  components: Joi.array()
    .items(
      Joi.object({
        label: Joi.string().trim().required(),
        icon: Joi.string().optional(),
        checked: Joi.boolean().optional(),
      })
    )
    .optional(),
});

const createRfqSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required(),
  academicYear: Joi.string().trim().max(20).optional(),
  requiredDate: Joi.date().optional(),
  quotationDeadline: Joi.date().optional(),
  classes: Joi.array().items(Joi.string().trim()).min(1).optional(),
  totalStudents: Joi.alternatives().try(Joi.number().min(0), Joi.string().trim()).optional(),
  specialInstructions: Joi.string().trim().max(500).optional(),
  additionalNotes: Joi.string().trim().max(300).optional(),
  uniformSets: Joi.array().items(uniformSetSchema).min(1).optional(),
  invitedVendorIds: Joi.array().items(schemas.objectId).min(1).optional(),
  status: Joi.string().valid('draft', 'open').default('open'),
});

const submitQuoteSchema = Joi.object({
  unitPrice: Joi.number().min(0).required(),
  taxRatePercent: Joi.number().min(0).max(100).default(0),
  deliveryTimeline: Joi.string().trim().max(200).optional(),
  termsAndConditions: Joi.string().trim().max(1000).optional(),
  validUntil: Joi.date().optional(),
  remarks: Joi.string().trim().max(500).optional(),
});

const rfqIdParam = Joi.object({
  rfqId: schemas.objectId.required(),
});

const quoteIdParam = Joi.object({
  rfqId: schemas.objectId.required(),
  quoteId: schemas.objectId.required(),
});

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('draft', 'open', 'reviewing', 'awarded', 'closed', 'cancelled').optional(),
  search: Joi.string().trim().max(100).optional(),
});

module.exports = {
  createRfqSchema,
  submitQuoteSchema,
  rfqIdParam,
  quoteIdParam,
  paginationQuery,
};
