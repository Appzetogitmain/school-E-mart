const { isDeliveryModuleEnabled } = require('./deliveryFlags');
const { shiprocketService } = require('./providers/shiprocket/shiprocketService');
const { buildPayload } = require('./internal/deliveryBroadcastPayload');

const guard = (fn, fallback = null) => async (...args) => {
  if (!isDeliveryModuleEnabled()) return fallback;
  return fn(...args);
};

const createShipment = guard((context) => shiprocketService.createShipment(context));
const cancelShipment = guard((context) => shiprocketService.cancelShipment(context));
const getTrackingInfo = guard((context) => shiprocketService.getTrackingInfo(context));
const getETA = guard((context) => shiprocketService.getETA(context));
const assignAWB = guard((shipmentId) => shiprocketService.assignAWB(shipmentId));
const generateLabel = guard((shipmentId) => shiprocketService.generateLabel(shipmentId));
const schedulePickup = guard((shipmentId) => shiprocketService.schedulePickup(shipmentId));
const normalizeShiprocketStatus = (rawStatus) => shiprocketService.mapStatus(rawStatus);

const markBroadcastAssigned = guard(async ({ orderId, winnerDeliveryId }) => {
  const { markLatestBroadcastAssigned } = require('./internal/deliveryAssignmentStore');
  return markLatestBroadcastAssigned({ orderId, winnerDeliveryId });
});

const buildDeliveryBroadcastPayload = (order, deliveryContext) => buildPayload(order, deliveryContext);

module.exports = {
  createShipment,
  cancelShipment,
  getTrackingInfo,
  getETA,
  assignAWB,
  generateLabel,
  schedulePickup,
  normalizeShiprocketStatus,
  markBroadcastAssigned,
  buildDeliveryBroadcastPayload,
};
