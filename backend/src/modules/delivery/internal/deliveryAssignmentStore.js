const OrderShipment = require('../../../database/models/OrderShipment');

const markLatestBroadcastAssigned = async ({ orderId, winnerDeliveryId }) => {
  return OrderShipment.findOneAndUpdate(
    { orderId },
    { $set: { winnerDeliveryId } },
    { new: true, sort: { 'audit.createdAt': -1 } }
  ).lean();
};

module.exports = {
  markLatestBroadcastAssigned,
};
