const OrderTrackingEvent = require('../../../database/models/OrderTrackingEvent');

const trackingRepository = {
  create(data) {
    return OrderTrackingEvent.create(data);
  },

  findByShipment(shipmentId) {
    return OrderTrackingEvent.find({ shipmentId }).sort({ at: 1 }).lean();
  },
};

module.exports = trackingRepository;
