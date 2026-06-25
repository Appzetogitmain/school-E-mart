const { mapShiprocketStatus } = require('./providers/shiprocket/shiprocketStatusMap');

const WORKFLOW_STATUS = Object.freeze({
  DELIVERY_ASSIGNED: 'accepted',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURN_INITIATED: 'returned',
  RETURNED: 'returned',
  DELIVERY_FAILED: null,
});

const normalizeShiprocketStatus = (rawStatus) => mapShiprocketStatus(rawStatus);

module.exports = {
  WORKFLOW_STATUS,
  normalizeShiprocketStatus,
};
