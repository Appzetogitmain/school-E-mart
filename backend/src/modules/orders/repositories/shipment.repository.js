const OrderShipment = require('../../../database/models/OrderShipment');
const { BaseRepository } = require('../../../repositories');

class ShipmentRepository extends BaseRepository {
  constructor() {
    super(OrderShipment, { useSoftDelete: false });
  }

  findByOrder(orderId) {
    return this.findMany({ orderId });
  }

  findByOrderAndVendor(orderId, vendorId) {
    return this.findOne({ orderId, vendorId });
  }
}

module.exports = new ShipmentRepository();
