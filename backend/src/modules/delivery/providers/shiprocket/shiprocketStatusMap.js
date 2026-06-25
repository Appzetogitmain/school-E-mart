const SHIPROCKET_STATUS_MAP = {
  'PICKUP SCHEDULED': 'accepted',
  'OUT FOR PICKUP': 'accepted',
  'PICKUP ERROR': 'cancelled',
  'PICKUP COMPLETE': 'out_for_delivery',
  'OUT FOR DELIVERY': 'out_for_delivery',
  DELIVERED: 'delivered',
  UNDELIVERED: 'cancelled',
  MISROUTED: 'cancelled',
  'RTO INITIATED': 'returned',
  'RTO IN TRANSIT': 'returned',
  'RTO DELIVERED': 'returned',
  CANCELLED: 'cancelled',
  LOST: 'cancelled',
};

const mapShiprocketStatus = (rawStatus) => {
  if (!rawStatus) return null;
  return SHIPROCKET_STATUS_MAP[String(rawStatus).toUpperCase()] || null;
};

module.exports = {
  SHIPROCKET_STATUS_MAP,
  mapShiprocketStatus,
};
