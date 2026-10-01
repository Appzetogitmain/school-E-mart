const { NotFoundError, BadRequestError, ForbiddenError } = require('../../../common/errors');
const orderRepository = require('../repositories/order.repository');
const vendorAccessPolicy = require('../policies/vendorAccess.policy');
const Order = require('../../../database/models/Order');
const User = require('../../../database/models/User');
const ParentProfile = require('../../../database/models/ParentProfile');
const ChildProfile = require('../../../database/models/ChildProfile');
const { triggerService } = require('../../../services/notification');
const { AWAITING_PAYMENT, PAYMENT_FAILED } = require('../../orders/utils/statusMachine');

// 'pending_payment' is deliberately absent: an unpaid online order is not the vendor's
// to work on, so every transition out of it is refused here as well as being hidden
// from the vendor's list and order lookup below.
const VENDOR_TRANSITIONS = {
  placed: ['accepted', 'cancelled'],
  accepted: ['processed', 'cancelled'],
  processed: ['packed', 'cancelled'],
  packed: ['shipped'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

async function enrichOrdersWithCustomerDetails(orders) {
  if (!orders || orders.length === 0) return orders;

  const userIds = [...new Set(orders.map((o) => (o.userId ? String(o.userId) : null)).filter(Boolean))];
  const [users, parentProfiles, childProfiles] = await Promise.all([
    userIds.length > 0 ? User.find({ _id: { $in: userIds } }).select('name phone email role').lean() : [],
    userIds.length > 0 ? ParentProfile.find({ userId: { $in: userIds } }).lean() : [],
    userIds.length > 0 ? ChildProfile.find({ parentUserId: { $in: userIds } }).lean() : [],
  ]);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const parentProfileMap = new Map(parentProfiles.map((p) => [String(p.userId), p]));
  const childByParentUser = new Map();
  const childById = new Map();

  for (const c of childProfiles) {
    childById.set(String(c._id), c);
    if (!childByParentUser.has(String(c.parentUserId))) {
      childByParentUser.set(String(c.parentUserId), c);
    }
  }

  return orders.map((order) => {
    const plainOrder = order.toObject ? order.toObject() : { ...order };
    const uId = plainOrder.userId ? String(plainOrder.userId) : null;
    const user = uId ? userMap.get(uId) : null;
    const parentProfile = uId ? parentProfileMap.get(uId) : null;

    let child = null;
    if (parentProfile?.activeChildId) {
      child = childById.get(String(parentProfile.activeChildId));
    }
    if (!child && uId) {
      child = childByParentUser.get(uId);
    }

    const isSchoolOrder = plainOrder.audience === 'school';
    const parentName = plainOrder.address?.name || user?.name || (isSchoolOrder ? 'School Buyer' : 'Customer');
    const studentName = isSchoolOrder ? 'Institutional Order' : (child?.name || '—');
    const studentGrade = child?.grade ? `Class ${child.grade}` : null;

    return {
      ...plainOrder,
      parentName,
      studentName,
      studentGrade,
      paymentStatus: plainOrder.paymentStatus || 'pending',
    };
  });
}

const vendorOrderService = {
  async listOrders(vendorId, query) {
    const filter = {};
    // A vendor must never be shown an order that has not been paid for — it would put
    // stock aside and start packing against money that may never arrive.
    filter.orderStatus =
      query.status && query.status !== AWAITING_PAYMENT && query.status !== PAYMENT_FAILED
        ? query.status
        : { $nin: [AWAITING_PAYMENT, PAYMENT_FAILED] };
    if (query.from || query.to) {
      filter['audit.createdAt'] = {};
      if (query.from) filter['audit.createdAt'].$gte = new Date(query.from);
      if (query.to) filter['audit.createdAt'].$lte = new Date(query.to);
    }
    if (query.search) {
      filter.orderNumber = { $regex: query.search, $options: 'i' };
    }
    // Only paging and sorting are forwarded. The paginator runs every other query key
    // back through ApiFeatures.filter as a raw top-level equality match, and an Order
    // has no top-level `status`, `from` or `to` field — so passing the whole query
    // through ANDed `{ status: 'placed' }` onto the filter built above and the vendor's
    // filtered list came back empty every time.
    const { page, limit, sort, fields } = query;
    const result = await orderRepository.paginateVendorOrders(vendorId, { page, limit, sort, fields }, filter);
    if (result && Array.isArray(result.data)) {
      result.data = await enrichOrdersWithCustomerDetails(result.data);
    }
    return result;
  },

  async getOrder(vendorId, orderId) {
    const order = await orderRepository.findVendorOrder(vendorId, orderId);
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
    // Unpaid online orders do not exist as far as a vendor is concerned, so knowing an
    // id is not a way around the list filter above.
    if (order.orderStatus === AWAITING_PAYMENT || order.orderStatus === PAYMENT_FAILED) {
      throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
    }

    const [enriched] = await enrichOrdersWithCustomerDetails([order]);
    const vendorItems = (enriched.items || []).filter((item) => String(item.vendorId) === String(vendorId));
    return { ...enriched, vendorItems };
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

    // RFQ-awarded orders collect payment in two parts (advance up front, the
    // remainder any time after). A vendor must not mark one delivered while
    // the remainder is still outstanding — `paymentStatus` only reaches
    // 'paid' once confirmRemainderPayment actually captures it.
    if (status === 'delivered' && order.rfqAdvance && order.paymentStatus !== 'paid') {
      throw new BadRequestError(
        'The remaining payment for this quotation order has not been collected yet',
        null,
        'RFQ_REMAINDER_NOT_PAID'
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
