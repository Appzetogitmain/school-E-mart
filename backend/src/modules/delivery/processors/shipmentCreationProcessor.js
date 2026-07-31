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

  const VendorProfile = require('../../../database/models/VendorProfile');

  const orderShipments = await OrderShipment.find({ orderId: context.orderMongoId }).lean();
  const vendorIds = orderShipments.map((s) => s.vendorId).filter(Boolean);
  const vendorProfiles = await VendorProfile.find({ _id: { $in: vendorIds } }).lean();

  const allManual = vendorProfiles.length > 0 && vendorProfiles.every((vp) => vp.fulfillmentMethod === 'manual');

  if (allManual) {
    await DeliveryShipment.findOneAndUpdate(
      { orderId: String(context.orderId) },
      {
        $set: {
          orderMongoId: context.orderMongoId,
          deliveryProvider: 'manual',
          status: 'pending',
          idempotencyKey: context.idempotencyKey || idemKey,
        },
      },
      { upsert: true, new: true }
    );

    await OrderShipment.updateMany(
      { orderId: context.orderMongoId },
      { $set: { deliveryProvider: 'manual' } }
    );

    const manualResult = { manualDelivery: true, provider: 'manual' };
    await idempotencyService.store(idemKey, manualResult, 86400);
    logger.info('Order assigned to manual delivery vendor - Shiprocket creation skipped', { domain: 'delivery', provider: 'manual', orderId: context.orderId });
    return manualResult;
  }

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
