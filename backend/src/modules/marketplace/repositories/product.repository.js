const Product = require('../../../database/models/Product');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');
const ApiFeatures = require('../../../utils/apiFeatures');
const { parsePagination, buildPaginationMeta } = require('../../../common/pagination');

class ProductRepository extends BaseRepository {
  constructor() {
    super(Product);
  }

  async paginateProducts(filter, queryString = {}, options = {}) {
    const mergedFilter = this.mergeFilter(filter);
    const { page, limit, skip } = parsePagination(queryString, options);

    const featureQuery = { ...queryString };
    [
      'q',
      'sort',
      'page',
      'limit',
      'fields',
      'search',
      'featured',
      'offers',
      'minPrice',
      'maxPrice',
      'minRating',
      'availability',
      'grade',
      'brand',
      'headerId',
      'categoryId',
      'subcategoryId',
    ].forEach((key) => delete featureQuery[key]);

    let baseQuery = Product.find(mergedFilter);
    if (queryString.q) {
      baseQuery = Product.find({ ...mergedFilter, $text: { $search: queryString.q } });
    }

    const features = new ApiFeatures(baseQuery, featureQuery);
    features.filter().sort(options.defaultSort).limitFields(options.defaultFields);

    const [data, total] = await Promise.all([
      features.query.clone().skip(skip).limit(limit).lean(),
      queryString.q
        ? Product.countDocuments({ ...mergedFilter, $text: { $search: queryString.q } })
        : Product.countDocuments(mergedFilter),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ total, page, limit }),
    };
  }

  findPublishedFilter(extra = {}) {
    return {
      approvalStatus: 'approved',
      publishStatus: 'published',
      ...extra,
    };
  }
}

module.exports = new ProductRepository();
