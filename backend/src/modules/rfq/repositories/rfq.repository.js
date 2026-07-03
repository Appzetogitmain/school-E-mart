const Rfq = require('../../../database/models/Rfq');
const { BaseRepository } = require('../../../repositories');

class RfqRepository extends BaseRepository {
  constructor() {
    super(Rfq);
  }

  paginateRfqs(filter = {}, queryString = {}, options = {}) {
    return this.paginate(filter, queryString, {
      sort: options.sort || { 'audit.createdAt': -1 },
      ...options,
    });
  }
}

module.exports = new RfqRepository();
