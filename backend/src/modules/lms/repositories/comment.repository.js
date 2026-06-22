const LmsComment = require('../../../database/models/LmsComment');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class CommentRepository extends BaseRepository {
  constructor() {
    super(LmsComment);
  }

  paginateComments(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsComment, this.mergeFilter(filter), queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }
}

module.exports = new CommentRepository();
