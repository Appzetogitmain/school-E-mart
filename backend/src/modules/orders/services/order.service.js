const mongoose = require('mongoose');
const { NotFoundError, BadRequestError } = require('../../../common/errors');
const Order = require('../../../database/models/Order');
const OrderShipment = require('../../../database/models/OrderShipment');
const orderRepository = require('../repositories/order.repository');
const checkoutService = require('./checkout.service');
const commissionService = require('./commission.service');
const inventoryService = require('./inventory.service');
const paymentService = require('./payment.service');
const cartService = require('../../marketplace/services/cart.service');
const { generateOrderNumber } = require('../utils/orderNumber');
const { runAtomic } = require('../utils/atomic');
const { canTransition } = require('../utils/statusMachine');
const settlementService = require('../../vendor/services/settlement.service');
const walletService = require('../../wallet/services/wallet.service');
const { deliveryShipmentQueue } = require('../../../queues/deliveryQueues');
const { triggerService } = require('../../../services/notification');

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

    // Snapshot the commission split onto each line so payouts are fixed at order
    // time and never re-priced by a later rate change.
    const commissionSplits = await commissionService.resolveItemsCommission(summary.items, {
      userId,
      audience,
    });

    // Wallet application: clamp the requested amount to the wallet balance and the
    // order total; the gateway / COD collects only the remaining payable amount.
    const walletBalance = await walletService.getBalance(userId);
    const requestedWallet = Math.max(0, Math.round(Number(payload.walletAmountPaise) || 0));
    const walletAmountPaise = Math.min(requestedWallet, walletBalance.balancePaise, summary.totalPaise);
    const payablePaise = summary.totalPaise - walletAmountPaise;

    return runAtomic(async (session) => {
      const opts = session ? { session } : {};

      // Block duplicate kit purchases for the same parent
      const Kit = require('../../../database/models/Kit');
      const kitIdsInOrder = [];
      for (const item of summary.items) {
        const idToCheck = item.kitId || item.productId;
        if (idToCheck) {
          const isKit = await Kit.exists({ _id: idToCheck });
          if (isKit) kitIdsInOrder.push(idToCheck);
        }
      }

      if (kitIdsInOrder.length) {
        const existingKitOrder = await Order.findOne({
          userId,
          orderStatus: { $nin: ['cancelled', 'returned'] },
          $or: [
            { 'items.kitId': { $in: kitIdsInOrder } },
            { 'items.productId': { $in: kitIdsInOrder } },
          ],
        }).session(session).lean();

        if (existingKitOrder) {
          throw new BadRequestError('You have already purchased this kit.', null, 'KIT_ALREADY_PURCHASED');
        }
      }

      await inventoryService.deductStock(summary.items, session);

      const orderNumber = generateOrderNumber();
      const initialStatus = 'placed';
      // COD and online orders with a payable balance start with pending payment status;
      // 100% wallet-paid or zero-total orders are paid up front.
      const paymentStatus = payablePaise === 0 ? 'paid' : 'pending';

      const [order] = await Order.create(
        [
          {
            orderNumber,
            userId,
            audience,
            items: summary.items.map((item, idx) => ({
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
              // Commission snapshot (see commission.service). schoolId is the
              // school that earns the school share on this line, if any.
              kitId: item.kitId || undefined,
              kitItems: item.kitItems || undefined,
              schoolId: commissionSplits[idx]?.schoolId || undefined,
              commission: {
                adminPercent: commissionSplits[idx]?.adminPercent ?? 0,
                schoolPercent: commissionSplits[idx]?.schoolPercent ?? 0,
              },
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
            walletAmountPaise,
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

      // Debit the wallet portion first so an insufficient balance aborts before
      // any gateway work (the amount was already clamped, so this rarely throws).
      if (walletAmountPaise > 0) {
        await walletService.postTransaction(userId, {
          type: 'debit',
          category: 'order_payment',
          amountPaise: walletAmountPaise,
          reference: { kind: 'Order', id: order._id },
          description: `Wallet applied to order ${orderNumber}`,
        });
      }

      const payment = await paymentService.createPaymentForOrder(order, {
        method: paymentMethod,
        amountPaise: payablePaise,
        session,
      });
      if (paymentMethod === 'cod' && payablePaise > 0) {
        await paymentService.confirmPayment(order._id, { session });
      }

      await Order.findByIdAndUpdate(order._id, { $set: { paymentId: payment._id } }, opts);

      const validVendorIds = vendorIds.filter((vId) => vId && mongoose.Types.ObjectId.isValid(vId));
      const shipmentDocs = validVendorIds.map((vendorId) => ({
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

      const hydratedOrder = (await orderRepository.findById(order._id)) || order;

      try {
        await deliveryShipmentQueue.add({
          orderId: String(order.orderNumber),
          orderMongoId: order._id,
          pickup: {
            name: 'School E-Mart',
            phone: '9999999999',
            address: 'Default pickup location',
            pincode: payload.address?.pinCode || payload.address?.pincode || '',
          },
          drop: {
            name: payload.address?.name || 'Customer',
            phone: payload.address?.phone || '9999999999',
            address: payload.address?.line1 || '',
            pincode: payload.address?.pinCode || payload.address?.pincode || '',
          },
          items: summary.items.map((item) => ({
            name: item.name,
            qty: item.quantity,
            weight: 0.5,
            value: Math.round((item.lineTotalPaise || 0) / 100),
          })),
          paymentMode: paymentMethod === 'cod' ? 'COD' : 'PREPAID',
          totalValue: Math.round((summary.totalPaise || 0) / 100),
          weight: Math.max(0.5, summary.items.length * 0.5),
          idempotencyKey: `shipment:create:${order.orderNumber}`,
        });
      } catch (shipErr) {
        // Background delivery queue warning should not block order placement
      }

      try {
        if (hydratedOrder && hydratedOrder.userId) {
          triggerService.notifyOrderPlaced(hydratedOrder);
        }
      } catch (notifyErr) {
        // Notification warning should not block order placement
      }

      return hydratedOrder;
    });
  },

  async getOrder(orderId) {
    let order = null;
    if (mongoose.Types.ObjectId.isValid(String(orderId))) {
      order = await orderRepository.findById(orderId);
    }
    if (!order) {
      order = await orderRepository.findByOrderNumber(orderId);
    }
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
      // One-time referral bonus on the invitee's first delivered order.
      const referralRewardService = require('../../wallet/services/referralReward.service');
      await referralRewardService.processOrderDelivered(updated);
    }

    triggerService.notifyOrderStatusChange(updated, status, note);
    return updated;
  },
};

module.exports = orderService;
