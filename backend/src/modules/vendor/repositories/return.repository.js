const ReturnRequest = require('../../../database/models/ReturnRequest');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class ReturnRepository extends BaseRepository {
  constructor() {
    super(ReturnRequest);
  }

  async paginateVendorReturns(vendorId, queryString = {}, extraFilter = {}) {
    const filter = this.mergeFilter({ vendorId, ...extraFilter });
    return executePaginatedQuery(this.model, filter, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }

  findVendorReturn(vendorId, returnId) {
    return this.findOne({ _id: returnId, vendorId });
  }
}

module.exports = new ReturnRepository();
