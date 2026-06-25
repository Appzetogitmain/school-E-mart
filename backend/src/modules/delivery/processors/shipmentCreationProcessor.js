const logger = require('../../../common/logger');
const DeliveryShipment = require('../../../database/models/DeliveryShipment');
const OrderShipment = require('../../../database/models/OrderShipment');
const idempotencyService = require('../../../services/idempotencyService');
const { shiprocketService } = require('../providers/shiprocket/shiprocketService');
const { deliveryTrackingQueue } = require('../../../queues/deliveryQueues');

const processShipmentCreationJob = async (job) => {
  const context = job.data;
  const idemKey = `shipment:create:${context.orderId}`;
  const existing = await idempotencyService.check(idemKey);
  if (existing?.result) return existing.result;

  const result = await shiprocketService.createShipment(context);
  if (!result) return null;

  await DeliveryShipment.findOneAndUpdate(
    { orderId: String(context.orderId) },
    {
      $set: {
        orderMongoId: context.orderMongoId,
        shiprocketOrderId: result.shiprocketOrderId,
        shiprocketShipmentId: result.shiprocketShipmentId,
        awbCode: result.awbCode,
        courierName: result.courierName,
        trackingUrl: result.trackingUrl,
        labelUrl: result.labelUrl,
        pickupScheduled: Boolean(result.pickupScheduled),
        pickupScheduledAt: result.pickupScheduledAt || null,
        shipmentCreatedAt: new Date(),
        status: result.pickupScheduled ? 'pickup_scheduled' : 'created',
        idempotencyKey: context.idempotencyKey || idemKey,
      },
    },
    { upsert: true, new: true }
  );

  await OrderShipment.updateMany(
    { orderId: context.orderMongoId },
    {
      $set: {
        shiprocketOrderId: result.shiprocketOrderId,
        shiprocketShipmentId: result.shiprocketShipmentId,
        awbCode: result.awbCode,
        awbNumber: result.awbCode,
        courierName: result.courierName,
        trackingUrl: result.trackingUrl,
        labelUrl: result.labelUrl,
        pickupScheduled: Boolean(result.pickupScheduled),
        pickupScheduledAt: result.pickupScheduledAt || null,
        shipmentCreatedAt: new Date(),
      },
    }
  );

  if (result.awbCode) {
    await deliveryTrackingQueue.add(
      { orderId: String(context.orderId), awbCode: result.awbCode },
      { repeat: { every: 120_000 }, jobId: `track:${context.orderId}`, removeOnComplete: true }
    );
  }

  await idempotencyService.store(idemKey, result, 86400);
  logger.info('Shiprocket shipment created', { domain: 'delivery', provider: 'shiprocket', orderId: context.orderId, awbCode: result.awbCode || null });
  return result;
};

module.exports = {
  processShipmentCreationJob,
};
