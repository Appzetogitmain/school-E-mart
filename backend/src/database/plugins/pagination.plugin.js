/**
 * Pagination Plugin for Mongoose
 * Provides a simple static paginate method.
 */
module.exports = function paginationPlugin(schema) {
  schema.statics.paginate = async function (query = {}, options = {}) {
    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 10;
    const sort = options.sort || { _id: -1 };
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([
      this.find(query).sort(sort).skip(skip).limit(limit).lean(options.lean === true),
      this.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      docs,
      total,
      limit,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };
  };
};
