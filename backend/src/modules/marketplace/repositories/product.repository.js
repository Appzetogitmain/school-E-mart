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
      // Owned by buildProductFilter; leaving them here would re-apply them as raw
      // ApiFeatures conditions.
      'approvalStatus',
      'publishStatus',
    ].forEach((key) => delete featureQuery[key]);

    let searchFilter = mergedFilter;
    if (queryString.q && String(queryString.q).trim()) {
      const escaped = String(queryString.q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      searchFilter = {
        ...mergedFilter,
        $or: [
          { name: { $regex: escaped, $options: 'i' } },
          { sku: { $regex: escaped, $options: 'i' } },
          { brand: { $regex: escaped, $options: 'i' } },
        ],
      };
    }

    let baseQuery = Product.find(searchFilter);

    const features = new ApiFeatures(baseQuery, featureQuery);
    features.filter().sort(options.defaultSort).limitFields(options.defaultFields);
    if (options.populate) {
      features.query = features.query.populate(options.populate);
    }

    const [data, total] = await Promise.all([
      features.query.clone().skip(skip).limit(limit).lean(),
      queryString.q
        ? Product.countDocuments(searchFilter)
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
