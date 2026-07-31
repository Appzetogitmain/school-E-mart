const Payment = require('../../../database/models/Payment');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment, { useSoftDelete: false });
  }

  findByOrderId(orderId, queryOptions = {}) {
    return this.findOne({ orderId }, queryOptions);
  }

  findByIdempotencyKey(key) {
    return this.findOne({ idempotencyKey: key });
  }

  async paginateByOrder(orderId, queryString = {}) {
    return executePaginatedQuery(this.model, { orderId }, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }
}

module.exports = new PaymentRepository();
