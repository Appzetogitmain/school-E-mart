const PayoutRequest = require('../../../database/models/PayoutRequest');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class PayoutRepository extends BaseRepository {
  constructor() {
    super(PayoutRequest);
  }

  async paginatePayouts(vendorId, queryString = {}, extraFilter = {}) {
    const filter = this.mergeFilter({ vendorId, ...extraFilter });
    return executePaginatedQuery(this.model, filter, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }

  sumPendingAmount(vendorId) {
    return this.model.aggregate([
      {
        $match: {
          vendorId,
          status: { $in: ['pending', 'processing'] },
          'softDelete.isDeleted': { $ne: true },
        },
      },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } },
    ]);
  }
}

module.exports = new PayoutRepository();
