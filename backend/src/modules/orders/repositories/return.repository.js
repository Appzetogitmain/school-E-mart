const ReturnRequest = require('../../../database/models/ReturnRequest');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class ReturnRepository extends BaseRepository {
  constructor() {
    super(ReturnRequest);
  }

  async paginateUserReturns(userId, queryString = {}, extraFilter = {}) {
    const filter = this.mergeFilter({ userId, ...extraFilter });
    return executePaginatedQuery(this.model, filter, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }

  findUserReturn(userId, returnId) {
    return this.findOne({ _id: returnId, userId });
  }
}

module.exports = new ReturnRepository();
