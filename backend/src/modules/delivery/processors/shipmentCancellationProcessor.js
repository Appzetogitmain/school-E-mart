const logger = require('../../../common/logger');
const DeliveryShipment = require('../../../database/models/DeliveryShipment');
const OrderShipment = require('../../../database/models/OrderShipment');
const idempotencyService = require('../../../services/idempotencyService');
const { shiprocketService } = require('../providers/shiprocket/shiprocketService');

const processShipmentCancellationJob = async (job) => {
  const context = job.data;
  const idemKey = `shipment:cancel:${context.orderId}`;
  const existing = await idempotencyService.check(idemKey);
  if (existing?.result) return existing.result;

  const result = await shiprocketService.cancelShipment(context);
  if (!result) return null;

  await DeliveryShipment.findOneAndUpdate(
    { orderId: String(context.orderId) },
    { $set: { status: 'cancelled', shipmentCancelledAt: new Date() } }
  );
  await OrderShipment.updateMany({ orderId: context.orderMongoId }, { $set: { status: 'cancelled', shipmentCancelledAt: new Date() } });
  await idempotencyService.store(idemKey, result, 86400);
  logger.info('Shiprocket shipment cancelled', { orderId: context.orderId });
  return result;
};

module.exports = {
  processShipmentCancellationJob,
};
