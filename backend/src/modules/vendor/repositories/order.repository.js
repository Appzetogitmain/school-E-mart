const Order = require('../../../database/models/Order');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async paginateVendorOrders(vendorId, queryString = {}, extraFilter = {}) {
    const filter = this.mergeFilter({
      vendorIds: vendorId,
      ...extraFilter,
    });
    return executePaginatedQuery(this.model, filter, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }

  findVendorOrder(vendorId, orderId) {
    return this.findOne({ _id: orderId, vendorIds: vendorId });
  }
}

module.exports = new OrderRepository();
