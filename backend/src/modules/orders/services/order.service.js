const { NotFoundError, BadRequestError } = require('../../../common/errors');
const Order = require('../../../database/models/Order');
const OrderShipment = require('../../../database/models/OrderShipment');
const orderRepository = require('../repositories/order.repository');
const checkoutService = require('./checkout.service');
const inventoryService = require('./inventory.service');
const paymentService = require('./payment.service');
const cartService = require('../../marketplace/services/cart.service');
const { generateOrderNumber } = require('../utils/orderNumber');
const { runAtomic } = require('../utils/atomic');
const { canTransition } = require('../utils/statusMachine');
const settlementService = require('../../vendor/services/settlement.service');

const stripPaginationMeta = (query = {}) => {
  const paginationQuery = { ...query };
  [
    'vendorId',
    'schoolId',
    'scope',
    'status',
    'paymentStatus',
    'audience',
    'userId',
    'search',
    'from',
    'to',
  ].forEach((key) => delete paginationQuery[key]);
  return paginationQuery;
};

const orderService = {
  async createOrder(userId, audience, payload, actor = {}) {
    const summary = await checkoutService.getOrderSummary(userId, audience, payload);
    checkoutService.validateShipping({
      address: payload.address,
      deliveryType: payload.deliveryType || 'home',
      schoolIdForPickup: payload.schoolIdForPickup,
    });

    const paymentMethod = payload.paymentMethod || 'cod';
    const vendorIds = [...new Set(summary.items.map((item) => item.vendorId))];

    return runAtomic(async (session) => {
      const opts = session ? { session } : {};

      await inventoryService.deductStock(summary.items, session);

      const orderNumber = generateOrderNumber();
      const initialStatus = paymentMethod === 'cod' ? 'placed' : 'placed';
      const paymentStatus = paymentMethod === 'cod' ? 'paid' : 'pending';

      const [order] = await Order.create(
        [
          {
            orderNumber,
            userId,
            audience,
            items: summary.items.map((item) => ({
              productId: item.productId,
              vendorId: item.vendorId,
              name: item.name,
              sku: item.sku,
              image: item.image,
              variantId: item.variantId,
              pricePaise: item.pricePaise,
              mrpPaise: item.mrpPaise,
              quantity: item.quantity,
              size: item.size,
              taxRatePercent: item.taxRatePercent,
              taxPaise: item.taxPaise,
              lineTotalPaise: item.lineTotalPaise,
              fulfilmentStatus: 'placed',
            })),
            vendorIds,
            subtotalPaise: summary.subtotalPaise,
            taxPaise: summary.taxPaise,
            discountPaise: summary.discountPaise,
            platformFeePaise: summary.platformFeePaise,
            deliveryChargePaise: summary.deliveryChargePaise,
            handlingChargePaise: summary.handlingChargePaise,
            totalPaise: summary.totalPaise,
            address: payload.address,
            gstin: payload.gstin,
            deliveryType: payload.deliveryType || 'home',
            schoolIdForPickup: payload.schoolIdForPickup,
            paymentMethod,
            paymentStatus,
            orderStatus: initialStatus,
            statusHistory: [
              {
                status: initialStatus,
                at: new Date(),
                note: 'Order placed',
                byUserId: actor.userId || userId,
              },
            ],
            placedAt: new Date(),
          },
        ],
        opts
      );

      const payment = await paymentService.createPaymentForOrder(order, { method: paymentMethod, session });
      if (paymentMethod === 'cod') {
        await paymentService.confirmPayment(order._id, { session });
      }

      await Order.findByIdAndUpdate(order._id, { $set: { paymentId: payment._id } }, opts);

      const shipmentDocs = vendorIds.map((vendorId) => ({
        orderId: order._id,
        vendorId,
        items: summary.items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => String(item.vendorId) === String(vendorId))
          .map(({ item, index }) => ({ orderItemIndex: index, quantity: item.quantity })),
        status: 'placed',
      }));
      if (shipmentDocs.length) {
        await OrderShipment.create(shipmentDocs, opts);
      }

      await cartService.clearCart(userId, audience);

      return orderRepository.findById(order._id);
    });
  },

  async getOrder(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
    return order;
  },

  async getOrderByNumber(orderNumber) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
    return order;
  },

  listCustomerOrders(userId, query, { audience } = {}) {
    const filter = { userId };
    if (audience) filter.audience = audience;
    if (query.status) filter.orderStatus = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search) filter.orderNumber = { $regex: query.search, $options: 'i' };
    if (query.from || query.to) {
      filter['audit.createdAt'] = {};
      if (query.from) filter['audit.createdAt'].$gte = new Date(query.from);
      if (query.to) filter['audit.createdAt'].$lte = new Date(query.to);
    }
    return orderRepository.paginateOrders(filter, stripPaginationMeta(query));
  },

  listAllOrders(query) {
    const filter = {};
    if (query.status) filter.orderStatus = query.status;
    if (query.audience) filter.audience = query.audience;
    if (query.userId) filter.userId = query.userId;
    if (query.vendorId) filter.vendorIds = query.vendorId;
    if (query.schoolId) filter.schoolIdForPickup = query.schoolId;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search) filter.orderNumber = { $regex: query.search, $options: 'i' };
    if (query.from || query.to) {
      filter['audit.createdAt'] = {};
      if (query.from) filter['audit.createdAt'].$gte = new Date(query.from);
      if (query.to) filter['audit.createdAt'].$lte = new Date(query.to);
    }
    return orderRepository.paginateOrders(filter, stripPaginationMeta(query));
  },

  listSchoolPickupOrders(schoolId, query) {
    const filter = {};
    if (query.status) filter.orderStatus = query.status;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search) filter.orderNumber = { $regex: query.search, $options: 'i' };
    if (query.from || query.to) {
      filter['audit.createdAt'] = {};
      if (query.from) filter['audit.createdAt'].$gte = new Date(query.from);
      if (query.to) filter['audit.createdAt'].$lte = new Date(query.to);
    }
    return orderRepository.paginateSchoolPickupOrders(schoolId, stripPaginationMeta(query), filter);
  },

  async updatePaymentStatus(orderId, paymentStatus, { session = null } = {}) {
    const opts = session ? { session } : {};
    const updated = await Order.findByIdAndUpdate(
      orderId,
      { $set: { paymentStatus } },
      { new: true, ...opts }
    ).lean();
    if (!updated) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
    return updated;
  },

  getTimeline(order) {
    return order.statusHistory || [];
  },

  async transitionStatus(orderId, { status, note }, actor = {}, { force = false } = {}) {
    const order = await this.getOrder(orderId);
    if (!force && !canTransition(order.orderStatus, status)) {
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
    if (status === 'delivered') {
      update.$set.deliveredAt = new Date();
      update.$set.paymentStatus = order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus;
    }
    if (status === 'returned') update.$set.orderStatus = 'returned';

    const updated = await Order.findByIdAndUpdate(orderId, update, { new: true }).lean();

    if (status === 'delivered') {
      for (const vendorId of updated.vendorIds || []) {
        await settlementService.recordOrderSettlement(vendorId, updated._id);
      }
    }

    return updated;
  },
};

module.exports = orderService;
