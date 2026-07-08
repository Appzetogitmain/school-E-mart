const { Joi, schemas } = require('../../../common/validation');

const objectId = schemas.objectId;

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().trim().optional(),
  fields: Joi.string().trim().optional(),
  search: Joi.string().trim().max(120).optional(),
  q: Joi.string().trim().max(120).optional(),
  status: Joi.string().trim().optional(),
  approval: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  publishStatus: Joi.string().valid('draft', 'published').optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
  approvalStatus: Joi.string().valid('pending', 'approved', 'suspended').optional(),
});

const idParam = Joi.object({ id: objectId.required() });
const productIdParam = Joi.object({ productId: objectId.required() });
const orderIdParam = Joi.object({ orderId: objectId.required() });
const returnIdParam = Joi.object({ returnId: objectId.required() });
const vendorIdParam = Joi.object({ vendorId: objectId.required() });

const addressSchema = Joi.object({
  line1: Joi.string().trim().max(200).optional(),
  line2: Joi.string().trim().max(200).optional(),
  city: Joi.string().trim().max(80).optional(),
  state: Joi.string().trim().max(80).optional(),
  country: Joi.string().trim().max(80).optional(),
  pinCode: Joi.string().trim().pattern(/^\d{6}$/).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  storeName: Joi.string().trim().min(2).max(80).required(),
  phone: schemas.indianMobile.required(),
  email: schemas.email.required(),
  password: schemas.password.required(),
  location: Joi.string().trim().max(200).optional(),
  city: Joi.string().trim().max(80).optional(),
  state: Joi.string().trim().max(80).optional(),
  country: Joi.string().trim().max(80).default('India'),
  pinCode: Joi.string().trim().pattern(/^\d{6}$/).optional(),
  coordinates: Joi.array().items(Joi.number()).length(2).optional(),
  serviceRadiusKm: Joi.number().min(0).max(500).default(10),
  categories: Joi.array().items(objectId).optional(),
  commissionPercent: Joi.number().min(0).max(100).optional(),
  address: addressSchema.optional(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  storeName: Joi.string().trim().min(2).max(80).optional(),
  phone: schemas.indianMobile.optional(),
  email: schemas.email.optional(),
  serviceRadiusKm: Joi.number().min(0).max(500).optional(),
  categories: Joi.array().items(objectId).optional(),
  address: addressSchema.optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});

const businessInfoSchema = Joi.object({
  storeName: Joi.string().trim().min(2).max(80).optional(),
  categories: Joi.array().items(objectId).optional(),
  serviceRadiusKm: Joi.number().min(0).max(500).optional(),
});

const taxInfoSchema = Joi.object({
  gstin: Joi.string()
    .trim()
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/)
    .optional()
    .allow(''),
  panCard: Joi.string()
    .trim()
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/)
    .optional()
    .allow(''),
});

const bankDetailsSchema = Joi.object({
  accountName: Joi.string().trim().max(120).optional(),
  bankName: Joi.string().trim().max(120).optional(),
  branch: Joi.string().trim().max(120).optional(),
  ifsc: Joi.string()
    .trim()
    .pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)
    .optional(),
  accountNumber: Joi.string().trim().min(8).max(20).optional(),
});

const documentSchema = Joi.object({
  type: Joi.string().trim().required(),
  attachmentId: objectId.required(),
});

const imageSchema = Joi.object({
  attachmentId: objectId.required(),
  alt: Joi.string().trim().max(120).optional(),
});

const createProductSchema = Joi.object({
  name: Joi.string().trim().min(2).max(160).required(),
  sku: Joi.string().trim().required(),
  brand: Joi.string().trim().optional(),
  description: Joi.string().trim().max(5000).optional(),
  headerId: objectId.required(),
  categoryId: objectId.required(),
  subcategoryId: objectId.optional(),
  gradeTags: Joi.array().items(Joi.string().trim()).optional(),
  pricePaise: Joi.number().integer().min(0).required(),
  originalPricePaise: Joi.number().integer().min(0).optional(),
  taxRatePercent: Joi.number().min(0).max(28).default(0),
  stock: Joi.number().integer().min(0).default(0),
  lowStockThreshold: Joi.number().integer().min(0).default(5),
  images: Joi.array().items(imageSchema).min(1).required(),
  sizes: Joi.array().items(Joi.string().trim()).optional(),
  publishStatus: Joi.string().valid('draft', 'published').optional(),
});

const updateProductSchema = createProductSchema.fork(
  ['name', 'sku', 'headerId', 'categoryId', 'images', 'pricePaise'],
  (s) => s.optional()
);

const publishStatusSchema = Joi.object({
  publishStatus: Joi.string().valid('draft', 'published').required(),
});

const visibilitySchema = Joi.object({
  publishStatus: Joi.string().valid('draft', 'published').optional(),
  approvalStatus: Joi.string().valid('pending', 'approved', 'rejected').optional(),
});

const inventoryUpdateSchema = Joi.object({
  stock: Joi.number().integer().min(0).optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
});

const inventoryAdjustSchema = Joi.object({
  adjustment: Joi.number().integer().required(),
  reason: Joi.string().trim().max(300).optional(),
});

const orderStatusSchema = Joi.object({
  status: Joi.string()
    .valid('accepted', 'processed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')
    .required(),
  note: Joi.string().trim().max(500).optional(),
});

const orderActionSchema = Joi.object({
  note: Joi.string().trim().max(500).optional(),
  reason: Joi.string().trim().max(500).optional(),
});

const returnStatusSchema = Joi.object({
  status: Joi.string()
    .valid('approved', 'rejected', 'qc_passed', 'pickup_assigned', 'in_transit', 'completed')
    .required(),
  note: Joi.string().trim().max(500).optional(),
  qcStatus: Joi.string().valid('pending', 'passed', 'failed').optional(),
});

const returnActionSchema = Joi.object({
  note: Joi.string().trim().max(500).optional(),
  reason: Joi.string().trim().max(500).optional(),
});

const verificationActionSchema = Joi.object({
  note: Joi.string().trim().max(500).optional(),
  reason: Joi.string().trim().max(500).optional(),
});

const payoutRequestSchema = Joi.object({
  amountPaise: Joi.number().integer().min(100).required(),
});

module.exports = {
  paginationQuery,
  idParam,
  productIdParam,
  orderIdParam,
  returnIdParam,
  vendorIdParam,
  addressSchema,
  registerSchema,
  updateProfileSchema,
  businessInfoSchema,
  taxInfoSchema,
  bankDetailsSchema,
  documentSchema,
  createProductSchema,
  updateProductSchema,
  publishStatusSchema,
  visibilitySchema,
  inventoryUpdateSchema,
  inventoryAdjustSchema,
  orderStatusSchema,
  orderActionSchema,
  returnStatusSchema,
  returnActionSchema,
  verificationActionSchema,
  payoutRequestSchema,
};
