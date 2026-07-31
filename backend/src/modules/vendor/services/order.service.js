const { NotFoundError, BadRequestError, ForbiddenError } = require('../../../common/errors');
const orderRepository = require('../repositories/order.repository');
const vendorAccessPolicy = require('../policies/vendorAccess.policy');
const Order = require('../../../database/models/Order');
const { triggerService } = require('../../../services/notification');

const VENDOR_TRANSITIONS = {
  placed: ['accepted', 'cancelled'],
  accepted: ['processed', 'cancelled'],
  processed: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

const vendorOrderService = {
  listOrders(vendorId, query) {
    const filter = {};
    if (query.status) filter.orderStatus = query.status;
    if (query.from || query.to) {
      filter['audit.createdAt'] = {};
      if (query.from) filter['audit.createdAt'].$gte = new Date(query.from);
      if (query.to) filter['audit.createdAt'].$lte = new Date(query.to);
    }
    if (query.search) {
      filter.orderNumber = { $regex: query.search, $options: 'i' };
    }
    return orderRepository.paginateVendorOrders(vendorId, query, filter);
  },

  async getOrder(vendorId, orderId) {
    const order = await orderRepository.findVendorOrder(vendorId, orderId);
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');

    const vendorItems = order.items.filter((item) => String(item.vendorId) === String(vendorId));
    return { ...order, vendorItems };
  },

  async updateOrderStatus(vendorId, orderId, { status, note, courierName, awbNumber, trackingUrl }, actor = {}) {
    const order = await orderRepository.findVendorOrder(vendorId, orderId);
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');

    const allowed = VENDOR_TRANSITIONS[order.orderStatus] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestError(
        `Cannot transition from ${order.orderStatus} to ${status}`,
        null,
        'INVALID_ORDER_TRANSITION'
      );
    }

    const statusEntry = {
      status,
      at: new Date(),
      note,
      byUserId: actor.userId,
    };

    const update = {
      $set: { orderStatus: status },
      $push: { statusHistory: statusEntry },
    };

    if (status === 'accepted') update.$set.acceptedAt = new Date();
    if (status === 'delivered') update.$set.deliveredAt = new Date();
    if (status === 'cancelled') {
      update.$set.cancellation = {
        at: new Date(),
        reason: note || 'Rejected by vendor',
        byUserId: actor.userId,
      };
    }

    const updated = await Order.findOneAndUpdate(
      { _id: orderId, vendorIds: vendorId },
      update,
      { new: true }
    ).lean();

    const OrderShipment = require('../../../database/models/OrderShipment');
    const shipmentUpdate = { status };
    if (courierName) {
      shipmentUpdate.courier = courierName;
      shipmentUpdate.courierName = courierName;
    }
    if (awbNumber) {
      shipmentUpdate.awbNumber = awbNumber;
      shipmentUpdate.awbCode = awbNumber;
    }
    if (trackingUrl) shipmentUpdate.trackingUrl = trackingUrl;

    await OrderShipment.findOneAndUpdate(
      { orderId, vendorId },
      { $set: shipmentUpdate },
      { upsert: false }
    );

    if (status === 'delivered') {
      // Record vendor earnings + referral bonus — mirrors the orders-module path
      // so vendor-driven deliveries settle too.
      const settlementService = require('./settlement.service');
      for (const vId of updated.vendorIds || []) {
        await settlementService.recordOrderSettlement(vId, updated._id);
      }
      const referralRewardService = require('../../wallet/services/referralReward.service');
      await referralRewardService.processOrderDelivered(updated);
    }

    triggerService.notifyVendorOrderAction(updated, vendorId, status);
    return this.getOrder(vendorId, updated._id);
  },

  acceptOrder(vendorId, orderId, actor, note) {
    return this.updateOrderStatus(vendorId, orderId, { status: 'accepted', note }, actor);
  },

  async rejectOrder(vendorId, orderId, actor, reason) {
    await this.getOrder(vendorId, orderId);
    const cancellationService = require('../../orders/services/cancellation.service');
    return cancellationService.cancelOrder(
      orderId,
      { reason: reason || 'Rejected by vendor', cancelledBy: actor.userId },
      { role: 'vendor' }
    );
  },

  processOrder(vendorId, orderId, actor, note) {
    return this.updateOrderStatus(vendorId, orderId, { status: 'processed', note }, actor);
  },

  markReadyForDispatch(vendorId, orderId, actor, note) {
    return this.updateOrderStatus(vendorId, orderId, { status: 'packed', note }, actor);
  },

  getOrderHistory(vendorId, query) {
    return this.listOrders(vendorId, {
      ...query,
      status: query.status || undefined,
    });
  },

  async toggleKitItemPacked(vendorId, orderId, { itemIndex, kitItemIndex, packed }) {
    const order = await orderRepository.findVendorOrder(vendorId, orderId);
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');

    const item = order.items?.[itemIndex];
    if (!item || String(item.vendorId) !== String(vendorId)) {
      throw new NotFoundError('Order item not found', 'ORDER_ITEM_NOT_FOUND');
    }
    if (!item.kitItems?.[kitItemIndex]) {
      throw new NotFoundError('Kit item not found', 'KIT_ITEM_NOT_FOUND');
    }

    await Order.updateOne(
      { _id: orderId, vendorIds: vendorId },
      { $set: { [`items.${itemIndex}.kitItems.${kitItemIndex}.packed`]: !!packed } }
    );

    return this.getOrder(vendorId, orderId);
  },
};

module.exports = vendorOrderService;
