const { Joi, schemas } = require('../../../common/validation');

const objectId = schemas.objectId;

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().trim().optional(),
  fields: Joi.string().trim().optional(),
  search: Joi.string().trim().max(120).optional(),
  q: Joi.string().trim().max(120).optional(),
  headerId: objectId.optional(),
  categoryId: objectId.optional(),
  subcategoryId: objectId.optional(),
  brand: Joi.string().trim().optional(),
  grade: Joi.string().trim().optional(),
  minPrice: Joi.number().integer().min(0).optional(),
  maxPrice: Joi.number().integer().min(0).optional(),
  minRating: Joi.number().min(0).max(5).optional(),
  availability: Joi.string().valid('in_stock', 'out_of_stock', 'low_stock').optional(),
  featured: Joi.string().valid('true', 'false').optional(),
  offers: Joi.string().valid('true', 'false').optional(),
});

const idParam = Joi.object({ id: objectId.required() });
const productIdParam = Joi.object({ productId: objectId.required() });
const variantIdParam = productIdParam.keys({ variantId: objectId.required() });
const reviewIdParam = productIdParam.keys({ reviewId: objectId.required() });
const cartItemParam = Joi.object({
  productId: objectId.required(),
  variantId: objectId.optional(),
});

const audienceQuery = Joi.object({
  audience: Joi.string().valid('parent', 'school').default('parent'),
});

const headerCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  imageUrl: Joi.string().trim().uri().optional(),
  commissionPercent: Joi.number().min(0).max(100).default(0),
  feesFlatPaise: Joi.number().integer().min(0).default(0),
  status: Joi.string().valid('active', 'inactive').default('active'),
  displayOrder: Joi.number().integer().min(0).optional(),
});

const updateHeaderCategorySchema = headerCategorySchema.fork(['name'], (s) => s.optional());

const categorySchema = Joi.object({
  headerId: objectId.required(),
  name: Joi.string().trim().min(2).max(80).required(),
  imageUrl: Joi.string().trim().uri().optional(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  displayOrder: Joi.number().integer().min(0).optional(),
});

const updateCategorySchema = categorySchema.fork(['headerId', 'name'], (s) => s.optional());

const subcategorySchema = Joi.object({
  categoryId: objectId.required(),
  name: Joi.string().trim().min(2).max(80).required(),
  imageUrl: Joi.string().trim().uri().optional(),
  status: Joi.string().valid('active', 'inactive').default('active'),
  displayOrder: Joi.number().integer().min(0).optional(),
});

const updateSubcategorySchema = subcategorySchema.fork(['categoryId', 'name'], (s) => s.optional());

const reorderSchema = Joi.object({
  orderedIds: Joi.array().items(objectId).min(1).required(),
  headerId: objectId.optional(),
  categoryId: objectId.optional(),
});

const imageSchema = Joi.object({
  attachmentId: objectId.required(),
  alt: Joi.string().trim().max(120).optional(),
});

const specSchema = Joi.object({
  key: Joi.string().trim().required(),
  value: Joi.string().trim().required(),
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
  specs: Joi.array().items(specSchema).optional(),
  publishStatus: Joi.string().valid('draft', 'published').optional(),
  approvalStatus: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  vendorId: objectId.optional(),
});

const updateProductSchema = createProductSchema.fork(
  ['name', 'sku', 'headerId', 'categoryId', 'images', 'pricePaise'],
  (s) => s.optional()
);

const publishStatusSchema = Joi.object({
  publishStatus: Joi.string().valid('draft', 'published').required(),
});

const approvalStatusSchema = Joi.object({
  approvalStatus: Joi.string().valid('pending', 'approved', 'rejected').required(),
});

const inventorySchema = Joi.object({
  stock: Joi.number().integer().min(0).optional(),
  lowStockThreshold: Joi.number().integer().min(0).optional(),
});

const variantInventorySchema = Joi.object({
  stock: Joi.number().integer().min(0).required(),
});

const createVariantSchema = Joi.object({
  attributes: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  sku: Joi.string().trim().required(),
  pricePaise: Joi.number().integer().min(0).required(),
  stock: Joi.number().integer().min(0).required(),
});

const updateVariantSchema = createVariantSchema.fork(
  ['attributes', 'sku', 'pricePaise', 'stock'],
  (s) => s.optional()
);

const cartItemSchema = Joi.object({
  productId: objectId.required(),
  variantId: objectId.optional(),
  quantity: Joi.number().integer().min(1).default(1),
  size: Joi.string().trim().optional(),
});

const updateCartQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

const wishlistItemSchema = Joi.object({
  productId: objectId.required(),
});

const reviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  title: Joi.string().trim().max(120).optional(),
  body: Joi.string().trim().max(2000).optional(),
  attachments: Joi.array().items(objectId).optional(),
});

module.exports = {
  paginationQuery,
  idParam,
  productIdParam,
  variantIdParam,
  reviewIdParam,
  cartItemParam,
  audienceQuery,
  headerCategorySchema,
  updateHeaderCategorySchema,
  categorySchema,
  updateCategorySchema,
  subcategorySchema,
  updateSubcategorySchema,
  reorderSchema,
  createProductSchema,
  updateProductSchema,
  publishStatusSchema,
  approvalStatusSchema,
  inventorySchema,
  variantInventorySchema,
  createVariantSchema,
  updateVariantSchema,
  cartItemSchema,
  updateCartQuantitySchema,
  wishlistItemSchema,
  reviewSchema,
};
