const Order = require('../../../database/models/Order');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }

  async paginateOrders(filter = {}, queryString = {}, options = {}) {
    return executePaginatedQuery(this.model, this.mergeFilter(filter), queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }

  findByOrderNumber(orderNumber) {
    return this.findOne({ orderNumber });
  }

  findUserOrder(userId, orderId) {
    return this.findOne({ _id: orderId, userId });
  }

  paginateSchoolPickupOrders(schoolId, queryString = {}, extraFilter = {}) {
    const filter = this.mergeFilter({ schoolIdForPickup: schoolId, ...extraFilter });
    return executePaginatedQuery(this.model, filter, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }
}

module.exports = new OrderRepository();
