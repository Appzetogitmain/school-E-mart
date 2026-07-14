const ApiFeatures = require('../../utils/apiFeatures');
const { parsePagination, buildPaginationMeta } = require('../../common/pagination');

const executePaginatedQuery = async (model, filter = {}, queryString = {}, options = {}) => {
  const mergedFilter = { ...filter, ...(options.extraFilter || {}) };
  const { page, limit, skip } = parsePagination(queryString, options);

  const baseQuery = model.find(mergedFilter);
  const features = new ApiFeatures(baseQuery, queryString);
  features.filter().sort(options.defaultSort).limitFields(options.defaultFields);

  let pageQuery = features.query.clone().skip(skip).limit(limit);
  if (options.populate) {
    pageQuery = pageQuery.populate(options.populate);
  }

  const [data, total] = await Promise.all([
    pageQuery.lean(),
    model.countDocuments(mergedFilter),
  ]);

  return {
    data,
    pagination: buildPaginationMeta({ total, page, limit }),
  };
};

module.exports = {
  executePaginatedQuery,
};
