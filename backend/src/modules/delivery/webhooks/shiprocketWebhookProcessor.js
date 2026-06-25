const logger = require('../../../common/logger');
const DeliveryShipment = require('../../../database/models/DeliveryShipment');
const OrderShipment = require('../../../database/models/OrderShipment');
const orderService = require('../../orders/services/order.service');
const { shiprocketService } = require('../providers/shiprocket/shiprocketService');
const { deliveryTrackingQueue } = require('../../../queues/deliveryQueues');
const { emitToCustomer, emitToSeller } = require('../../../services/orderSocketEmitter');

const TERMINAL = new Set(['delivered', 'cancelled', 'returned']);

const processWebhookJob = async (job) => {
  const started = Date.now();
  const { rawBody, headers } = job.data;
  const parsed = shiprocketService.parseWebhookPayload(rawBody, headers);
  const canonicalStatus = shiprocketService.mapStatus(parsed.currentStatus);

  const shipment = await DeliveryShipment.findOneAndUpdate(
    { $or: [{ orderId: String(parsed.orderId || '') }, { awbCode: parsed.awbCode }] },
    {
      $set: {
        currentStatus: parsed.currentStatus || null,
        ...(canonicalStatus ? { status: canonicalStatus } : {}),
      },
      $push: {
        webhookLog: { receivedAt: new Date(), payload: parsed.meta, processed: true },
        timeline: {
          status: parsed.currentStatus || 'UNKNOWN',
          timestamp: new Date(),
          location: parsed.location || null,
          raw: parsed.meta,
        },
      },
    },
    { new: true }
  ).lean();

  if (!shipment) {
    logger.warn('Shiprocket webhook order/shipment not found', { orderId: parsed.orderId, awbCode: parsed.awbCode });
    return;
  }

  if (canonicalStatus && shipment.orderMongoId) {
    try {
      await orderService.transitionStatus(shipment.orderMongoId, { status: canonicalStatus, note: `Shiprocket: ${parsed.currentStatus}` }, { userId: null }, { force: true });
    } catch (error) {
      logger.warn('Order transition skipped for shiprocket webhook', { orderId: shipment.orderId, status: canonicalStatus, message: error.message });
    }
  }

  await OrderShipment.updateMany(
    { orderId: shipment.orderMongoId },
    {
      $set: {
        currentStatus: parsed.currentStatus || null,
        lastWebhookAt: new Date(),
        ...(shipment.awbCode ? { awbCode: shipment.awbCode, awbNumber: shipment.awbCode } : {}),
      },
      $push: { webhookLogs: parsed.meta },
    }
  );

  await emitToCustomer(String(shipment.orderMongoId), { event: 'order:tracking_update', payload: { orderId: shipment.orderId, status: canonicalStatus, currentStatus: parsed.currentStatus, awbCode: shipment.awbCode, courierName: shipment.courierName, trackingUrl: shipment.trackingUrl } });
  await emitToSeller('admin', { event: 'delivery:status_change', payload: { orderId: shipment.orderId, awbCode: shipment.awbCode, oldStatus: null, newStatus: canonicalStatus, timestamp: new Date().toISOString() } });

  if (canonicalStatus && TERMINAL.has(canonicalStatus)) {
    const trackingJob = await deliveryTrackingQueue.getJob(`track:${shipment.orderId}`);
    await trackingJob?.remove();
  }

  logger.info('Shiprocket webhook processed', {
    domain: 'delivery',
    provider: 'shiprocket',
    orderId: shipment.orderId,
    status: canonicalStatus || 'unmapped',
    durationMs: Date.now() - started,
  });
};

module.exports = {
  processWebhookJob,
};
