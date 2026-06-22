const Product = require('../../../database/models/Product');
const productRepository = require('../repositories/product.repository');
const recentlyViewedRepository = require('../repositories/recentlyViewed.repository');

const recommendationService = {
  async getRelatedProducts(productId, limit = 8) {
    const product = await productRepository.findById(productId);
    if (!product) return [];

    return Product.find(
      productRepository.mergeFilter(
        productRepository.findPublishedFilter({
          _id: { $ne: productId },
          $or: [
            { categoryId: product.categoryId },
            { subcategoryId: product.subcategoryId },
            { brand: product.brand },
          ],
        })
      )
    )
      .sort({ salesCount: -1 })
      .limit(limit)
      .lean();
  },

  async getSimilarProducts(productId, limit = 8) {
    const product = await productRepository.findById(productId);
    if (!product) return [];

    const filter = productRepository.mergeFilter(
      productRepository.findPublishedFilter({
        _id: { $ne: productId },
        categoryId: product.categoryId,
      })
    );
    if (product.gradeTags?.length) filter.gradeTags = { $in: product.gradeTags };

    return Product.find(filter).sort({ ratingAvg: -1, salesCount: -1 }).limit(limit).lean();
  },

  async getRecentlyViewed(userId, audience, limit = 20) {
    const views = await recentlyViewedRepository.listRecent(userId, audience, limit);
    if (!views.length) return [];
    const productIds = views.map((view) => view.productId);
    const products = await Product.find(
      productRepository.mergeFilter(
        productRepository.findPublishedFilter({ _id: { $in: productIds } })
      )
    ).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));
    return views.map((view) => productMap.get(String(view.productId))).filter(Boolean);
  },

  async recordProductView(userId, audience, productId) {
    await recentlyViewedRepository.upsertView(userId, audience, productId);
    return recentlyViewedRepository.listRecent(userId, audience, 20);
  },
};

module.exports = recommendationService;
