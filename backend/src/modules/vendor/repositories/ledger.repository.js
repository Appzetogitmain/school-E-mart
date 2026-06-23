const VendorLedger = require('../../../database/models/VendorLedger');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class LedgerRepository extends BaseRepository {
  constructor() {
    super(VendorLedger, { useSoftDelete: false });
  }

  findLatestBalance(vendorId) {
    return this.model
      .findOne({ vendorId })
      .sort({ 'audit.createdAt': -1 })
      .lean();
  }

  async paginateLedger(vendorId, queryString = {}, extraFilter = {}) {
    const filter = { vendorId, ...extraFilter };
    return executePaginatedQuery(this.model, filter, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }

  sumByType(vendorId, transactionType) {
    return this.model.aggregate([
      { $match: { vendorId } },
      { $match: { transactionType } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } },
    ]);
  }
}

module.exports = new LedgerRepository();
