const { Joi, schemas } = require('../../../common/validation');

const uniformSetImageSchema = Joi.object({
  label: Joi.string().trim().max(120).required(),
  attachmentId: schemas.objectId.optional(),
});

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
  images: Joi.array().items(uniformSetImageSchema).optional(),
});

// A deadline that's already in the past means no vendor can ever submit a quote —
// the RFQ is dead on arrival. Enforced server-side because the wizard's own
// pre-filled default and "required" check used to let exactly this through.
// Exempt for drafts: a draft is a work in progress, and a school must still be
// able to open and re-save an old one (fixing an unrelated field) without being
// blocked on a deadline it hasn't gotten to yet.
const futureDeadlineMessage = { 'date.min': 'Quotation deadline must be in the future' };
const futureDeadlineWhenLive = Joi.date().when('status', {
  is: 'draft',
  then: Joi.date().optional(),
  otherwise: Joi.date().min('now').messages(futureDeadlineMessage).optional(),
});

const createRfqSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).required(),
  academicYear: Joi.string().trim().max(20).optional(),
  requiredDate: Joi.date().optional(),
  quotationDeadline: futureDeadlineWhenLive,
  classes: Joi.array().items(Joi.string().trim()).min(1).optional(),
  totalStudents: Joi.alternatives().try(Joi.number().min(0), Joi.string().trim()).optional(),
  specialInstructions: Joi.string().trim().max(500).optional(),
  additionalNotes: Joi.string().trim().max(300).optional(),
  uniformSets: Joi.array().items(uniformSetSchema).min(1).optional(),
  invitedVendorIds: Joi.array().items(schemas.objectId).min(1).optional(),
  status: Joi.string().valid('draft', 'open').default('open'),
});

const updateRfqSchema = Joi.object({
  title: Joi.string().trim().min(3).max(100).optional(),
  academicYear: Joi.string().trim().max(20).optional(),
  requiredDate: Joi.date().optional().allow(null, ''),
  quotationDeadline: futureDeadlineWhenLive.allow(null, ''),
  classes: Joi.array().items(Joi.string().trim()).min(1).optional(),
  totalStudents: Joi.alternatives().try(Joi.number().min(0), Joi.string().trim()).optional().allow(null, ''),
  specialInstructions: Joi.string().trim().max(500).optional().allow(null, ''),
  additionalNotes: Joi.string().trim().max(300).optional().allow(null, ''),
  uniformSets: Joi.array().items(uniformSetSchema).min(1).optional(),
  invitedVendorIds: Joi.array().items(schemas.objectId).min(1).optional(),
  // 'cancelled' added: see rfqService.updateRfq — status is the only way a live
  // RFQ can be stopped, and the service's own error copy already told schools to
  // use it before this was actually wired up to accept the value.
  status: Joi.string().valid('draft', 'open', 'cancelled').optional(),
});

const submitQuoteSchema = Joi.object({
  unitPrice: Joi.number().min(0).required(),
  taxRatePercent: Joi.number().min(0).max(100).default(0),
  // What the vendor wants paid up front, as a percentage of the quote total —
  // the school sees this figure before ever awarding, so it's part of the bid
  // itself, not something negotiated after the fact.
  advancePercent: Joi.number().min(0).max(100).required(),
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

const orderIdParam = Joi.object({
  orderId: schemas.objectId.required(),
});

// Empty on initiate (there's nothing to submit yet); populated with the
// gateway's own response once the school's checkout completes.
const confirmRfqPaymentSchema = Joi.object({
  razorpayPaymentId: Joi.string().trim().optional(),
  razorpayOrderId: Joi.string().trim().optional(),
  razorpaySignature: Joi.string().trim().optional(),
}).default({});

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('draft', 'open', 'reviewing', 'awarded', 'closed', 'cancelled').optional(),
  search: Joi.string().trim().max(100).optional(),
});

module.exports = {
  createRfqSchema,
  updateRfqSchema,
  submitQuoteSchema,
  rfqIdParam,
  quoteIdParam,
  orderIdParam,
  confirmRfqPaymentSchema,
  paginationQuery,
};
