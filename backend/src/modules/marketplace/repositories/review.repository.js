const ProductReview = require('../../../database/models/ProductReview');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(ProductReview);
  }

  paginateReviews(filter, queryString, options = {}) {
    return executePaginatedQuery(ProductReview, this.mergeFilter(filter), queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }

  findByProductAndUser(productId, userId) {
    return this.findOne({ productId, userId });
  }
}

module.exports = new ReviewRepository();
