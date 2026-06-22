const { NotFoundError, ConflictError, ForbiddenError } = require('../../../common/errors');
const reviewRepository = require('../repositories/review.repository');
const productRepository = require('../repositories/product.repository');
const Order = require('../../../database/models/Order');
const Product = require('../../../database/models/Product');

const reviewService = {
  async assertVerifiedPurchase(userId, productId) {
    const order = await Order.findOne({
      userId,
      orderStatus: 'delivered',
      'items.productId': productId,
    }).lean();
    return order;
  },

  async createReview(userId, productId, payload, { requireVerifiedPurchase = true } = {}) {
    const product = await productRepository.findOne(
      productRepository.findPublishedFilter({ _id: productId })
    );
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');

    const existing = await reviewRepository.findByProductAndUser(productId, userId);
    if (existing) throw new ConflictError('You have already reviewed this product', 'REVIEW_DUPLICATE');

    let orderId = null;
    if (requireVerifiedPurchase) {
      const order = await this.assertVerifiedPurchase(userId, productId);
      if (!order) {
        throw new ForbiddenError('Only verified purchasers can review', 'REVIEW_NOT_VERIFIED');
      }
      orderId = order._id;
    }

    const review = await reviewRepository.create({
      productId,
      userId,
      orderId,
      rating: payload.rating,
      title: payload.title,
      body: payload.body,
      attachments: payload.attachments || [],
    });

    await this.recalculateProductRating(productId);
    return review;
  },

  async recalculateProductRating(productId) {
    const reviews = await reviewRepository.findMany({ productId });
    if (!reviews.length) {
      await productRepository.updateById(productId, { $set: { ratingAvg: 0, ratingCount: 0 } });
      return;
    }
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    const ratingAvg = Number((total / reviews.length).toFixed(2));
    await Product.updateOne({ _id: productId }, { $set: { ratingAvg, ratingCount: reviews.length } });
  },

  listReviews(productId, query) {
    return reviewRepository.paginateReviews({ productId }, query);
  },

  async updateReview(userId, productId, reviewId, payload) {
    const review = await reviewRepository.findOne({ _id: reviewId, productId, userId });
    if (!review) throw new NotFoundError('Review not found', 'REVIEW_NOT_FOUND');
    const updated = await reviewRepository.updateById(reviewId, { $set: payload });
    await this.recalculateProductRating(productId);
    return updated;
  },

  async deleteReview(userId, productId, reviewId, deletedBy) {
    const review = await reviewRepository.findOne({ _id: reviewId, productId, userId });
    if (!review) throw new NotFoundError('Review not found', 'REVIEW_NOT_FOUND');
    await reviewRepository.softDeleteById(reviewId, { deletedBy });
    await this.recalculateProductRating(productId);
    return review;
  },

  async getProductRatings(productId) {
    const product = await productRepository.findById(productId);
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');
    return {
      productId,
      ratingAvg: product.ratingAvg,
      ratingCount: product.ratingCount,
    };
  },
};

module.exports = reviewService;
