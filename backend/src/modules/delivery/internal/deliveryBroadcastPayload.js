const buildPayload = (order, deliveryContext = {}) => ({
  orderId: String(order._id),
  orderNumber: order.orderNumber,
  totalPaise: order.totalPaise,
  itemCount: (order.items || []).length,
  address: order.address || null,
  ...deliveryContext,
});

module.exports = {
  buildPayload,
};
