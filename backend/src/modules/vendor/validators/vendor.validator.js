const { Joi, schemas } = require('../../../common/validation');
const vendorFields = require('./vendorFields');

const objectId = schemas.objectId;

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(20),
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

// Postal fields come from the shared definition; coordinates travel alongside as
// latitude/longitude rather than nested in the address.
const addressSchema = vendorFields.addressSchema.keys({ ...vendorFields.geoFields });

// Signup deliberately asks for the minimum; everything else is completed later on
// the vendor profile page. commissionPercent is intentionally absent: it is the
// marketplace's cut, so a self-registering vendor must not be able to set it.
const registerSchema = Joi.object({
  name: vendorFields.identityFields.name.required(),
  storeName: vendorFields.identityFields.storeName.required(),
  phone: schemas.indianMobile.required(),
  email: schemas.email.required(),
  password: schemas.passwordBasic.required(),
  serviceRadiusKm: vendorFields.identityFields.serviceRadiusKm.default(10),
  categories: vendorFields.identityFields.categories.optional(),
  address: vendorFields.addressSchema.optional(),
  ...vendorFields.geoFields,
});

const updateProfileSchema = Joi.object({
  name: vendorFields.identityFields.name.optional(),
  storeName: vendorFields.identityFields.storeName.optional(),
  phone: schemas.indianMobile.optional(),
  email: schemas.email.optional(),
  serviceRadiusKm: vendorFields.identityFields.serviceRadiusKm.optional(),
  categories: vendorFields.identityFields.categories.optional(),
  address: vendorFields.addressSchema.optional(),
  ...vendorFields.geoFields,
});

const businessInfoSchema = Joi.object({
  storeName: vendorFields.identityFields.storeName.optional(),
  categories: vendorFields.identityFields.categories.optional(),
  serviceRadiusKm: vendorFields.identityFields.serviceRadiusKm.optional(),
});

const taxInfoSchema = Joi.object({ ...vendorFields.taxFields });

const bankDetailsSchema = vendorFields.bankSchema;

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
  // Who the vendor is selling this to: 'users' (retail, shown in the User app)
  // or 'schools' (bulk, shown in the School module).
  audience: Joi.string().valid('users', 'schools').default('users'),
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

const kitItemPackSchema = Joi.object({
  itemIndex: Joi.number().integer().min(0).required(),
  kitItemIndex: Joi.number().integer().min(0).required(),
  packed: Joi.boolean().required(),
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
  kitItemPackSchema,
  returnStatusSchema,
  returnActionSchema,
  verificationActionSchema,
  payoutRequestSchema,
};
