const { Joi, schemas } = require('../../../common/validation');

const objectId = schemas.objectId;

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().trim().optional(),
  fields: Joi.string().trim().optional(),
  search: Joi.string().trim().max(120).optional(),
  status: Joi.string().trim().optional(),
  paymentStatus: Joi.string().trim().optional(),
  audience: Joi.string().valid('parent', 'school').optional(),
  userId: objectId.optional(),
  vendorId: objectId.optional(),
  schoolId: objectId.optional(),
  scope: Joi.string().valid('own', 'pickup').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

const audienceQuery = Joi.object({
  audience: Joi.string().valid('parent', 'school').default('parent'),
});

const addressSchema = Joi.object({
  line1: Joi.string().trim().max(200).required(),
  line2: Joi.string().trim().max(200).optional(),
  city: Joi.string().trim().max(80).required(),
  state: Joi.string().trim().max(80).optional(),
  country: Joi.string().trim().max(80).default('India'),
  pinCode: Joi.string().trim().pattern(/^\d{6}$/).required(),
});

const checkoutSummarySchema = Joi.object({
  audience: Joi.string().valid('parent', 'school').optional(),
  deliveryType: Joi.string().valid('home', 'school').default('home'),
  paymentMethod: Joi.string().valid('online', 'cod').default('cod'),
  address: addressSchema.optional(),
  schoolIdForPickup: objectId.optional(),
  gstin: Joi.string().trim().optional(),
  deliveryChargePaise: Joi.number().integer().min(0).optional(),
  platformFeePaise: Joi.number().integer().min(0).optional(),
  handlingChargePaise: Joi.number().integer().min(0).optional(),
});

const createOrderSchema = checkoutSummarySchema.keys({
  address: addressSchema.required(),
  // Amount to draw from the customer's wallet. Clamped server-side to the actual
  // balance and order total, so an over-large value is safe.
  walletAmountPaise: Joi.number().integer().min(0).optional(),
});

const orderIdParam = Joi.object({ orderId: objectId.required() });
const orderNumberParam = Joi.object({ orderNumber: Joi.string().trim().required() });
const returnIdParam = Joi.object({ returnId: objectId.required() });
const shipmentIdParam = orderIdParam.keys({ shipmentId: objectId.required() });
const refundIdParam = orderIdParam.keys({ refundId: Joi.string().trim().required() });
const vendorIdBody = Joi.object({ vendorId: objectId.required() });

const cancelOrderSchema = Joi.object({
  reason: Joi.string().trim().min(3).max(500).required(),
});

const refundRequestSchema = Joi.object({
  amountPaise: Joi.number().integer().min(1).optional(),
  reason: Joi.string().trim().min(3).max(500).required(),
});

const refundActionSchema = Joi.object({
  reason: Joi.string().trim().max(500).optional(),
});

const createReturnSchema = Joi.object({
  orderItemIndex: Joi.number().integer().min(0).required(),
  reason: Joi.string().trim().min(3).max(300).required(),
  description: Joi.string().trim().max(1000).optional(),
  attachments: Joi.array().items(objectId).optional(),
});

const assignShipmentSchema = Joi.object({
  vendorId: objectId.required(),
  courier: Joi.string().trim().required(),
  awbNumber: Joi.string().trim().optional(),
  etaAt: Joi.date().iso().optional(),
});

const updateShipmentSchema = Joi.object({
  status: Joi.string()
    .valid('placed', 'accepted', 'processed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')
    .required(),
  notes: Joi.string().trim().max(500).optional(),
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array().items(Joi.number()).length(2),
  }).optional(),
});

const statusUpdateSchema = Joi.object({
  status: Joi.string()
    .valid('placed', 'accepted', 'processed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned')
    .required(),
  note: Joi.string().trim().max(500).optional(),
});

const confirmPaymentSchema = Joi.object({
  razorpayPaymentId: Joi.string().trim().optional(),
  razorpayOrderId: Joi.string().trim().optional(),
  razorpaySignature: Joi.string().trim().optional(),
}).default({});

module.exports = {
  paginationQuery,
  audienceQuery,
  checkoutSummarySchema,
  createOrderSchema,
  orderIdParam,
  orderNumberParam,
  returnIdParam,
  shipmentIdParam,
  refundIdParam,
  cancelOrderSchema,
  refundRequestSchema,
  refundActionSchema,
  createReturnSchema,
  assignShipmentSchema,
  updateShipmentSchema,
  confirmPaymentSchema,
  statusUpdateSchema,
};
