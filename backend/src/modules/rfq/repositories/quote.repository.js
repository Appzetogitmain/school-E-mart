const Quote = require('../../../database/models/Quote');
const { BaseRepository } = require('../../../repositories');

class QuoteRepository extends BaseRepository {
  constructor() {
    super(Quote);
  }

  findByRfqAndVendor(rfqId, vendorId) {
    return this.findOne({ rfqId, vendorId });
  }

  findByRfq(rfqId) {
    return this.findMany({ rfqId }, { sort: { totalPaise: 1 } });
  }
}

module.exports = new QuoteRepository();
