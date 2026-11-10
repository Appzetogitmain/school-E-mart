const Product = require('../../../database/models/Product');
const productRepository = require('../repositories/product.repository');
const recentlyViewedRepository = require('../repositories/recentlyViewed.repository');
const { PRODUCT_IMAGE_POPULATE } = require('./product.service');
const { buildGradeClauses } = require('./search.service');

// Storefront audience, same rule as search.service.js: the School module passes
// 'schools' (bulk catalogue), the parent app 'users'. Legacy products predate the
// field, so 'users' also matches a missing audience.
const audienceFilter = (audience) => {
  if (audience === 'schools') return { audience: { $in: ['schools', 'both'] } };
  if (audience === 'users') return { audience: { $ne: 'schools' } };
  return {};
};

const clampLimit = (limit, fallback) => {
  const parsed = Number.parseInt(limit, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, 24);
};

// Every query below must populate the image refs: without it images[].attachmentId
// stays a bare ObjectId and the storefront shows a placeholder instead of the photo.
const recommendationService = {
  // `grade` is the viewer's class. When given, a product tagged only for other classes is
  // left out (same rule as the product list), so a Nursery child is never suggested a
  // UKG-only item.
  async getRelatedProducts(productId, { limit = 8, audience, grade } = {}) {
    const product = await productRepository.findById(productId);
    if (!product) return [];

    const sameKind = [
      { categoryId: product.categoryId },
      { subcategoryId: product.subcategoryId },
      { brand: product.brand },
    ];

    return Product.find(
      productRepository.mergeFilter(
        productRepository.findPublishedFilter({
          _id: { $ne: productId },
          ...audienceFilter(audience),
          ...(grade
            ? { $and: [{ $or: sameKind }, { $or: buildGradeClauses(grade) }] }
            : { $or: sameKind }),
        })
      )
    )
      .sort({ salesCount: -1 })
      .limit(clampLimit(limit, 8))
      .populate(PRODUCT_IMAGE_POPULATE)
      .lean();
  },

  async getSimilarProducts(productId, { limit = 8, audience } = {}) {
    const product = await productRepository.findById(productId);
    if (!product) return [];

    const filter = productRepository.mergeFilter(
      productRepository.findPublishedFilter({
        _id: { $ne: productId },
        ...audienceFilter(audience),
        categoryId: product.categoryId,
      })
    );
    if (product.gradeTags?.length) filter.gradeTags = { $in: product.gradeTags };

    return Product.find(filter)
      .sort({ ratingAvg: -1, salesCount: -1 })
      .limit(clampLimit(limit, 8))
      .populate(PRODUCT_IMAGE_POPULATE)
      .lean();
  },

  async getRecentlyViewed(userId, audience, limit = 20) {
    const views = await recentlyViewedRepository.listRecent(userId, audience, limit);
    if (!views.length) return [];
    const productIds = views.map((view) => view.productId);
    const products = await Product.find(
      productRepository.mergeFilter(
        productRepository.findPublishedFilter({ _id: { $in: productIds } })
      )
    )
      .populate(PRODUCT_IMAGE_POPULATE)
      .lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    return views.map((view) => productMap.get(String(view.productId))).filter(Boolean);
  },

  async recordProductView(userId, audience, productId) {
    await recentlyViewedRepository.upsertView(userId, audience, productId);
    return recentlyViewedRepository.listRecent(userId, audience, 20);
  },
};

module.exports = recommendationService;
