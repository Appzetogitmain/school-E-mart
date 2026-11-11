const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const productRepository = require('../repositories/product.repository');
const variantRepository = require('../repositories/variant.repository');
const { uniqueSlug } = require('../utils/slug');
const { buildProductFilter, resolveSort } = require('./search.service');
const Product = require('../../../database/models/Product');
const ProductVariant = require('../../../database/models/ProductVariant');
const { normalizeVariantInputs, summarizeVariants } = require('../utils/variants.util');

// Ensure all referenced models are registered in Mongoose schema map prior to populate()
require('../../../database/models/HeaderCategory');
require('../../../database/models/Category');
require('../../../database/models/Subcategory');
require('../../../database/models/VendorProfile');
require('../../../database/models/Attachment');

// Every product image is a ref to an Attachment doc holding the real storageKey —
// without this, image.attachmentId stays an unpopulated ObjectId and the customer
// catalog silently loses every product photo.
const PRODUCT_IMAGE_POPULATE = [
  { path: 'images.attachmentId', select: 'storageKey' },
  { path: 'sizeChartAttachmentId', select: 'storageKey' },
];

// Refs the admin product list renders by name rather than by id.
const ADMIN_PRODUCT_POPULATE = [
  { path: 'headerId', select: 'name' },
  { path: 'categoryId', select: 'name' },
  { path: 'subcategoryId', select: 'name' },
  { path: 'vendorId', select: 'storeName' },
  { path: 'variants', select: 'attributes sku pricePaise originalPricePaise stock' },
  ...PRODUCT_IMAGE_POPULATE,
];

const normalizeGradeTags = (tags) => {
  if (!Array.isArray(tags)) return tags;
  const filtered = tags
    .filter((t) => t && typeof t === 'string')
    .map((t) => t.trim())
    .filter(Boolean);
  const withoutAll = filtered.filter(
    (t) => !['All', 'all', 'All Grades', 'all-grades'].includes(t)
  );
  if (withoutAll.length > 0) {
    return Array.from(new Set(withoutAll));
  }
  return filtered.length > 0 ? ['All Grades'] : [];
};

const productService = {
  async createProduct(vendorId, payload) {
    const slug = await uniqueSlug(Product, payload.name);
    const existingSku = await productRepository.findOne({ sku: payload.sku });
    if (existingSku) throw new ConflictError('SKU already exists', 'SKU_EXISTS');

    // A product can have several variants (sizes / packs), each with its own price, MRP and
    // stock. The product's own price and stock are then DERIVED from them (lowest price, total stock).
    const { variants: variantInputs, ...rest } = payload;
    const variants = variantInputs && variantInputs.length ? normalizeVariantInputs(variantInputs) : null;
    const derived = variants ? summarizeVariants(variants) : null;

    const pricePaise = derived ? derived.pricePaise : rest.pricePaise;
    const originalPricePaise = derived ? derived.originalPricePaise : rest.originalPricePaise;
    if (originalPricePaise && originalPricePaise < pricePaise) {
      throw new BadRequestError('Original price cannot be less than selling price', null, 'INVALID_PRICE');
    }

    if (rest.gradeTags) rest.gradeTags = normalizeGradeTags(rest.gradeTags);
    const product = await productRepository.create({
      ...rest,
      ...(derived ? { pricePaise: derived.pricePaise, originalPricePaise: derived.originalPricePaise ?? undefined, stock: derived.stock, sizes: derived.sizes } : {}),
      vendorId,
      slug,
      approvalStatus: payload.approvalStatus || 'approved',
      publishStatus: payload.publishStatus || 'published',
      stock: derived ? derived.stock : payload.stock ?? 0,
      lowStockThreshold: payload.lowStockThreshold ?? 5,
      salesCount: 0,
      ratingCount: 0,
    });

    if (variants) {
      try {
        await this.syncVariants(product._id, variants);
      } catch (error) {
        // never leave a half-created product (no variants) behind
        await Product.deleteOne({ _id: product._id });
        await ProductVariant.deleteMany({ productId: product._id });
        throw error;
      }
      return productRepository.findById(product._id);
    }
    return product;
  },

  /**
   * Makes the product's variants exactly `inputs` (already normalised): variants with an `id` are
   * updated, new ones are created, variants missing from the list are deleted. An empty list turns
   * the product back into a simple product. Then re-derives the product's price / stock / sizes.
   */
  async syncVariants(productId, inputs) {
    const product = await productRepository.findOne({ _id: productId });
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');

    const existing = await ProductVariant.find({ productId }).lean();
    const existingById = new Map(existing.map((v) => [String(v._id), v]));
    const keepIds = new Set();

    for (const input of inputs) {
      const attributes = { size: input.label };
      if (input.id) {
        const current = existingById.get(String(input.id));
        if (!current) throw new BadRequestError(`Variant "${input.label}" no longer exists. Reload and try again`, null, 'VARIANT_INVALID');
        keepIds.add(String(input.id));
        await ProductVariant.updateOne(
          { _id: input.id, productId },
          {
            $set: {
              attributes,
              pricePaise: input.pricePaise,
              stock: input.stock,
              ...(input.originalPricePaise ? { originalPricePaise: input.originalPricePaise } : {}),
            },
            ...(input.originalPricePaise ? {} : { $unset: { originalPricePaise: '' } }),
          }
        );
      } else {
        const created = await ProductVariant.create({
          productId,
          attributes,
          sku: await this.uniqueVariantSku(product.sku, input.label, input.sku),
          pricePaise: input.pricePaise,
          stock: input.stock,
          ...(input.originalPricePaise ? { originalPricePaise: input.originalPricePaise } : {}),
        });
        keepIds.add(String(created._id));
      }
    }

    const removeIds = existing.map((v) => String(v._id)).filter((id) => !keepIds.has(id));
    if (removeIds.length) await ProductVariant.deleteMany({ _id: { $in: removeIds }, productId });

    return this.refreshFromVariants(productId);
  },

  /** A unique SKU for a variant: the vendor's own, or "<product sku>-<label>". */
  async uniqueVariantSku(productSku, label, requested) {
    const base = (requested || `${productSku}-${String(label).toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 12) || 'V'}`).trim();
    let candidate = base;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const taken = await variantRepository.findBySku(candidate);
      if (!taken) return candidate;
      candidate = `${base}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    }
    throw new ConflictError('Could not generate a unique variant SKU', 'VARIANT_SKU_EXISTS');
  },

  /**
   * Re-derives the product's variants list, price (lowest), MRP, stock (total) and sizes from its
   * variant documents. Call after anything that changes a variant (edit, sale, cancellation).
   */
  async refreshFromVariants(productId, { session = null } = {}) {
    const opts = session ? { session } : {};
    const variants = await ProductVariant.find({ productId }).sort({ _id: 1 }).session(session).lean();
    if (!variants.length) {
      return Product.findByIdAndUpdate(productId, { $set: { variants: [], sizes: [] } }, { new: true, ...opts });
    }
    const summary = summarizeVariants(
      variants.map((v) => ({
        label: v.attributes?.size || '',
        pricePaise: v.pricePaise,
        originalPricePaise: v.originalPricePaise || null,
        stock: v.stock,
      }))
    );
    return Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          variants: variants.map((v) => v._id),
          pricePaise: summary.pricePaise,
          stock: summary.stock,
          sizes: summary.sizes,
          ...(summary.originalPricePaise ? { originalPricePaise: summary.originalPricePaise } : {}),
        },
        ...(summary.originalPricePaise ? {} : { $unset: { originalPricePaise: '' } }),
      },
      { new: true, ...opts }
    );
  },

  async getProduct(productId, { publicOnly = false, withVariants = false } = {}) {
    const filter = publicOnly ? productRepository.findPublishedFilter({ _id: productId }) : { _id: productId };
    const populate = withVariants
      ? [...PRODUCT_IMAGE_POPULATE, { path: 'variants', select: 'attributes sku pricePaise originalPricePaise stock' }]
      : PRODUCT_IMAGE_POPULATE;
    const product = await productRepository.findOne(filter).populate(populate);
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  listProducts(query, options = {}) {
    const filter = buildProductFilter(query, options);
    return productRepository.paginateProducts(filter, query, {
      defaultSort: resolveSort(query.sort),
      populate: options.populate || PRODUCT_IMAGE_POPULATE,
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
    const { variants: variantInputs, ...rest } = payload;
    if (rest.originalPricePaise && rest.pricePaise && rest.originalPricePaise < rest.pricePaise) {
      throw new BadRequestError('Original price cannot be less than selling price', null, 'INVALID_PRICE');
    }
    if (rest.gradeTags) rest.gradeTags = normalizeGradeTags(rest.gradeTags);

    // `variants` present = the vendor is (re)defining the variant list (an empty list = back to a
    // simple product that uses the plain price / stock in `rest`).
    const variants = variantInputs !== undefined ? normalizeVariantInputs(variantInputs) : undefined;
    const current = await productRepository.findOne({ _id: productId });
    if (!current) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');

    const hasVariantsAfter = variants !== undefined ? variants.length > 0 : (current.variants || []).length > 0;
    if (hasVariantsAfter) {
      // price, MRP, stock and sizes belong to the variants, so a plain edit must not overwrite them
      const touched = ['pricePaise', 'originalPricePaise', 'stock', 'sizes'].filter((key) => rest[key] !== undefined);
      if (touched.length && variants === undefined) {
        throw new BadRequestError(
          'This product has variants. Edit the price and stock of each variant instead',
          null,
          'PRODUCT_HAS_VARIANTS'
        );
      }
      for (const key of ['pricePaise', 'originalPricePaise', 'stock', 'sizes']) delete rest[key];
    }

    const product = Object.keys(rest).length
      ? await productRepository.updateById(productId, { $set: rest })
      : current;
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');

    if (variants !== undefined) {
      await this.syncVariants(productId, variants);
      return productRepository.findById(productId);
    }
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
    if (stock !== undefined) {
      const current = await productRepository.findOne({ _id: productId });
      if (current && (current.variants || []).length) {
        throw new BadRequestError(
          'This product has variants. Update the stock of each variant instead',
          null,
          'PRODUCT_HAS_VARIANTS'
        );
      }
    }
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
    await this.refreshFromVariants(productId);
    return variant;
  },

  listVariants(productId) {
    return variantRepository.findByProduct(productId);
  },

  async updateVariant(productId, variantId, payload) {
    const variant = await variantRepository.updateById(variantId, { $set: payload }, { productId });
    if (!variant) throw new NotFoundError('Variant not found', 'VARIANT_NOT_FOUND');
    await this.refreshFromVariants(productId);
    return variant;
  },

  async deleteVariant(productId, variantId) {
    const variant = await variantRepository.findOne({ _id: variantId, productId });
    if (!variant) throw new NotFoundError('Variant not found', 'VARIANT_NOT_FOUND');
    await variantRepository.model.deleteOne({ _id: variantId });
    await productRepository.updateById(productId, { $pull: { variants: variantId } });
    await this.refreshFromVariants(productId);
    return variant;
  },

  async updateVariantInventory(productId, variantId, stock) {
    const variant = await variantRepository.updateById(variantId, { $set: { stock } }, { productId });
    if (!variant) throw new NotFoundError('Variant not found', 'VARIANT_NOT_FOUND');
    await this.refreshFromVariants(productId);
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
  PRODUCT_IMAGE_POPULATE,
};

module.exports = productService;
