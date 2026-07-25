const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const productRepository = require('../repositories/product.repository');
const variantRepository = require('../repositories/variant.repository');
const { uniqueSlug } = require('../utils/slug');
const { buildProductFilter, resolveSort } = require('./search.service');
const Product = require('../../../database/models/Product');

// Ensure all referenced models are registered in Mongoose schema map prior to populate()
require('../../../database/models/HeaderCategory');
require('../../../database/models/Category');
require('../../../database/models/Subcategory');
require('../../../database/models/VendorProfile');
require('../../../database/models/Attachment');

// Refs the admin product list renders by name rather than by id.
const ADMIN_PRODUCT_POPULATE = [
  { path: 'headerId', select: 'name' },
  { path: 'categoryId', select: 'name' },
  { path: 'subcategoryId', select: 'name' },
  { path: 'vendorId', select: 'storeName' },
  { path: 'images.attachmentId', select: 'storageKey' },
];

const productService = {
  async createProduct(vendorId, payload) {
    const slug = await uniqueSlug(Product, payload.name);
    const existingSku = await productRepository.findOne({ sku: payload.sku });
    if (existingSku) throw new ConflictError('SKU already exists', 'SKU_EXISTS');

    if (payload.originalPricePaise && payload.originalPricePaise < payload.pricePaise) {
      throw new BadRequestError('Original price cannot be less than selling price', null, 'INVALID_PRICE');
    }

    return productRepository.create({
      ...payload,
      vendorId,
      slug,
      approvalStatus: payload.approvalStatus || 'approved',
      publishStatus: payload.publishStatus || 'published',
      stock: payload.stock ?? 0,
      lowStockThreshold: payload.lowStockThreshold ?? 5,
      salesCount: 0,
      ratingCount: 0,
    });
  },

  async getProduct(productId, { publicOnly = false } = {}) {
    const filter = publicOnly ? productRepository.findPublishedFilter({ _id: productId }) : { _id: productId };
    const product = await productRepository.findOne(filter);
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  listProducts(query, options = {}) {
    const filter = buildProductFilter(query, options);
    return productRepository.paginateProducts(filter, query, {
      defaultSort: resolveSort(query.sort),
      populate: options.populate,
    });
  },

  /**
   * Admin catalog listing: unlike listProducts, this returns products in every
   * moderation state (pending/rejected/draft) so they can actually be moderated,
   * and resolves the taxonomy/vendor/image refs the list UI needs to render.
   * Callers must gate this behind an admin guard.
   */
  listProductsForAdmin(query) {
    return this.listProducts(query, {
      publicOnly: false,
      populate: ADMIN_PRODUCT_POPULATE,
    });
  },

  listFeatured(query) {
    return this.listProducts({ ...query, featured: 'true', sort: query.sort || 'popular' });
  },

  listOffers(query) {
    return this.listProducts({ ...query, offers: 'true', sort: query.sort || 'price_asc' });
  },

  async updateProduct(productId, payload) {
    if (payload.originalPricePaise && payload.pricePaise && payload.originalPricePaise < payload.pricePaise) {
      throw new BadRequestError('Original price cannot be less than selling price', null, 'INVALID_PRICE');
    }
    const product = await productRepository.updateById(productId, { $set: payload });
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  async deleteProduct(productId, deletedBy) {
    const product = await productRepository.softDeleteById(productId, { deletedBy });
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  async setPublishStatus(productId, publishStatus) {
    const product = await productRepository.updateById(productId, { $set: { publishStatus } });
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  async setApprovalStatus(productId, approvalStatus) {
    const product = await productRepository.updateById(productId, { $set: { approvalStatus } });
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  getInventoryStatus(product) {
    const availableQuantity = product.stock ?? 0;
    const reservedQuantity = 0;
    let stockStatus = 'in_stock';
    if (availableQuantity === 0) stockStatus = 'out_of_stock';
    else if (availableQuantity <= (product.lowStockThreshold ?? 5)) stockStatus = 'low_stock';
    return { availableQuantity, reservedQuantity, stockStatus };
  },

  async updateInventory(productId, { stock, lowStockThreshold }) {
    const update = {};
    if (stock !== undefined) update.stock = stock;
    if (lowStockThreshold !== undefined) update.lowStockThreshold = lowStockThreshold;
    const product = await productRepository.updateById(productId, { $set: update });
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return { product, inventory: this.getInventoryStatus(product) };
  },

  async addVariant(productId, payload) {
    await this.getProduct(productId);
    const existingSku = await variantRepository.findBySku(payload.sku);
    if (existingSku) throw new ConflictError('Variant SKU already exists', 'VARIANT_SKU_EXISTS');

    const variant = await variantRepository.create({ ...payload, productId });
    await productRepository.updateById(productId, { $addToSet: { variants: variant._id } });
    return variant;
  },

  listVariants(productId) {
    return variantRepository.findByProduct(productId);
  },

  async updateVariant(productId, variantId, payload) {
    const variant = await variantRepository.updateById(variantId, { $set: payload }, { productId });
    if (!variant) throw new NotFoundError('Variant not found', 'VARIANT_NOT_FOUND');
    return variant;
  },

  async deleteVariant(productId, variantId) {
    const variant = await variantRepository.findOne({ _id: variantId, productId });
    if (!variant) throw new NotFoundError('Variant not found', 'VARIANT_NOT_FOUND');
    await variantRepository.model.deleteOne({ _id: variantId });
    await productRepository.updateById(productId, { $pull: { variants: variantId } });
    return variant;
  },

  async updateVariantInventory(productId, variantId, stock) {
    const variant = await variantRepository.updateById(variantId, { $set: { stock } }, { productId });
    if (!variant) throw new NotFoundError('Variant not found', 'VARIANT_NOT_FOUND');
    return {
      variant,
      inventory: {
        availableQuantity: variant.stock,
        reservedQuantity: 0,
        stockStatus: variant.stock === 0 ? 'out_of_stock' : variant.stock <= 5 ? 'low_stock' : 'in_stock',
      },
    };
  },

  getOfferDisplay(product) {
    if (!product.originalPricePaise || product.originalPricePaise <= product.pricePaise) return null;
    const discountPaise = product.originalPricePaise - product.pricePaise;
    const discountPercent = Math.round((discountPaise / product.originalPricePaise) * 100);
    return {
      originalPricePaise: product.originalPricePaise,
      pricePaise: product.pricePaise,
      discountPaise,
      discountPercent,
      isLimitedOffer: discountPercent >= 10,
    };
  },

  ADMIN_PRODUCT_POPULATE,
};

module.exports = productService;
