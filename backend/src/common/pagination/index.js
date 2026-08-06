const parsePagination = (query = {}, defaults = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || defaults.page || 1);
  const maxLimit = defaults.maxLimit || 10000;
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number.parseInt(query.limit, 10) || defaults.limit || 20)
  );

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

const buildPaginationMeta = ({ total, page, limit }) => {
  const totalPages = total > 0 ? Math.ceil(total / limit) : 0;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

module.exports = {
  parsePagination,
  buildPaginationMeta,
};
