const mongoose = require('mongoose');
const logger = require('../../../common/logger');
const { NotFoundError, BadRequestError } = require('../../../common/errors');
const Order = require('../../../database/models/Order');
const OrderShipment = require('../../../database/models/OrderShipment');
const orderRepository = require('../repositories/order.repository');
const checkoutService = require('./checkout.service');
const commissionService = require('./commission.service');
const inventoryService = require('./inventory.service');
const paymentService = require('./payment.service');
const cartService = require('../../marketplace/services/cart.service');
const paymentRepository = require('../repositories/payment.repository');
const { generateOrderNumber } = require('../utils/orderNumber');
const { runAtomic } = require('../utils/atomic');
const { canTransition, AWAITING_PAYMENT } = require('../utils/statusMachine');

// How long an unpaid online order holds its stock before the sweeper releases it.
// Long enough for a customer to finish a UPI collect request, short enough that an
// abandoned checkout does not keep goods off the shelf.
const PENDING_PAYMENT_TTL_MS = 30 * 60 * 1000;
const settlementService = require('../../vendor/services/settlement.service');
const walletService = require('../../wallet/services/wallet.service');
const { deliveryShipmentQueue } = require('../../../queues/deliveryQueues');
const { triggerService } = require('../../../services/notification');

/**
 * Turn a status filter into a Mongo condition.
 *
 * The admin list offers an "in progress" shortcut covering several pipeline
 * statuses at once, so a comma-separated list has to be accepted as well as a
 * single value. Only an exact single status matched before, so anything else
 * quietly returned nothing — a filter that looks like it works while hiding
 * orders.
 */
const buildStatusFilter = (status) => {
  const values = String(status)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (values.length === 0) return null;
  return values.length === 1 ? values[0] : { $in: values };
};

/**
 * Build the search condition for an order lookup.
 *
 * Two problems with the previous `{ $regex: query.search }`:
 *
 *  - The raw string went into a regular expression unescaped, so a search
 *    containing regex syntax either silently matched the wrong thing or, with a
 *    pathological pattern, could pin the database on backtracking. User input is
 *    now escaped and matched literally.
 *  - It only ever looked at the order number. An operator handed a customer name
 *    or a phone number — which is how support requests actually arrive — got
 *    nothing back, even though the order carries both.
 */
const buildSearchFilter = (search) => {
  const term = String(search).trim();
  if (!term) return null;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const rx = { $regex: escaped, $options: 'i' };
  return [{ orderNumber: rx }, { 'address.name': rx }, { 'address.phone': rx }];
};

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
        // Shared with the kit page and the cart guard so all three agree on what
        // "already purchased" means — see kits.service.purchasedKitOrderFilter.
        const kitsService = require('../../academics/services/kits.service');
        const existingKitOrder = await Order.findOne(
          kitsService.purchasedKitOrderFilter(userId, kitIdsInOrder)
        ).session(session).lean();

        if (existingKitOrder) {
          throw new BadRequestError('You have already purchased this kit.', null, 'KIT_ALREADY_PURCHASED');
        }
      }

      await inventoryService.deductStock(summary.items, session);

      const orderNumber = generateOrderNumber();

      // An online order with money still to collect is not a placed order. It is held
      // as 'pending_payment' — no vendor sees it, no shipment or delivery job exists
      // for it, the cart is left intact, and nobody is told an order was placed — until
      // a payment is actually captured. COD is different by design: the courier
      // collects on delivery, so the order is real the moment it is placed. A fully
      // wallet-paid or zero-total order is already paid, so it is real too.
      const requiresPrepayment = paymentMethod === 'online' && payablePaise > 0;
      const initialStatus = requiresPrepayment ? 'pending_payment' : 'placed';
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
            ...(requiresPrepayment
              ? { paymentExpiresAt: new Date(Date.now() + PENDING_PAYMENT_TTL_MS) }
              : {}),
            statusHistory: [
              {
                status: initialStatus,
                at: new Date(),
                note: requiresPrepayment ? 'Awaiting online payment' : 'Order placed',
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

      // Everything below turns a record into a live order that vendors work on. None of
      // it may happen for an online order that has not been paid for — doing it at
      // creation is precisely what let an unpaid order reach fulfilment. It runs again,
      // once, from activateOrder when the payment is captured.
      if (!requiresPrepayment) {
        await this.applyPlacementEffects(order, summary.items, { session });
        await cartService.clearCart(userId, audience);
      }

      return (await orderRepository.findById(order._id)) || order;
    });
  },

  /**
   * The side effects of an order becoming real: vendor shipments, the delivery job, and
   * telling the customer it was placed. Split out of createOrder so a prepaid online
   * order can run exactly the same steps at the moment its payment is captured.
   *
   * Every step is idempotent or guarded, because activation can be reached twice — once
   * from the client confirming the payment and once from the Razorpay webhook.
   */
  async applyPlacementEffects(order, items, { session = null } = {}) {
    const opts = session ? { session } : {};
    const vendorIds = [...new Set((order.vendorIds || []).map(String))];
    const validVendorIds = vendorIds.filter((vId) => vId && mongoose.Types.ObjectId.isValid(vId));

    const shipmentDocs = [];
    for (const vendorId of validVendorIds) {
      // Guarded rather than blindly created: activation can arrive twice, and a
      // duplicate shipment would show the vendor the same order to pack twice.
      const exists = await OrderShipment.exists({ orderId: order._id, vendorId });
      if (exists) continue;
      shipmentDocs.push({
        orderId: order._id,
        vendorId,
        items: items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => String(item.vendorId) === String(vendorId))
          .map(({ item, index }) => ({ orderItemIndex: index, quantity: item.quantity })),
        status: 'placed',
      });
    }
    if (shipmentDocs.length) {
      await OrderShipment.create(shipmentDocs, opts);
    }

    const address = order.address || {};
    try {
      await deliveryShipmentQueue.add({
        orderId: String(order.orderNumber),
        orderMongoId: order._id,
        pickup: {
          name: 'School E-Mart',
          phone: '9999999999',
          address: 'Default pickup location',
          pincode: address.pinCode || address.pincode || '',
        },
        drop: {
          name: address.name || 'Customer',
          phone: address.phone || '9999999999',
          address: address.line1 || '',
          pincode: address.pinCode || address.pincode || '',
        },
        items: items.map((item) => ({
          name: item.name,
          qty: item.quantity,
          weight: 0.5,
          value: Math.round((item.lineTotalPaise || 0) / 100),
        })),
        paymentMode: order.paymentMethod === 'cod' ? 'COD' : 'PREPAID',
        totalValue: Math.round((order.totalPaise || 0) / 100),
        weight: Math.max(0.5, items.length * 0.5),
        // The queue de-duplicates on this, so a second activation cannot book a
        // second courier pickup for the same order.
        idempotencyKey: `shipment:create:${order.orderNumber}`,
      });
    } catch (shipErr) {
      // Background delivery queue warning should not block order placement
    }

    try {
      const hydrated = (await orderRepository.findById(order._id)) || order;
      if (hydrated && hydrated.userId) {
        triggerService.notifyOrderPlaced(hydrated);
      }
    } catch (notifyErr) {
      // Notification warning should not block order placement
    }
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
    if (query.status) {
      const customerStatusFilter = buildStatusFilter(query.status);
      if (customerStatusFilter) filter.orderStatus = customerStatusFilter;
    }
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search) {
      const or = buildSearchFilter(query.search);
      if (or) filter.$or = or;
    }
    if (query.from || query.to) {
      filter['audit.createdAt'] = {};
      if (query.from) filter['audit.createdAt'].$gte = new Date(query.from);
      if (query.to) filter['audit.createdAt'].$lte = new Date(query.to);
    }
    return orderRepository.paginateOrders(filter, stripPaginationMeta(query));
  },

  /**
   * The filter the admin order list runs on.
   *
   * Extracted so the statistics cards can be computed from *precisely* the same
   * conditions as the rows beneath them. Building the two separately is how a
   * header ends up claiming a total the table does not show.
   */
  buildAdminOrderFilter(query = {}) {
    const filter = {};
    // An unpaid online order is not a sale. It stays out of the operations list and
    // out of every total computed from it unless someone asks for it by name.
    const adminStatusFilter = query.status ? buildStatusFilter(query.status) : null;
    filter.orderStatus = adminStatusFilter || { $ne: AWAITING_PAYMENT };
    if (query.audience) filter.audience = query.audience;
    if (query.userId) filter.userId = query.userId;
    if (query.vendorId) filter.vendorIds = query.vendorId;
    if (query.schoolId) filter.schoolIdForPickup = query.schoolId;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search) {
      const or = buildSearchFilter(query.search);
      if (or) filter.$or = or;
    }
    if (query.from || query.to) {
      filter['audit.createdAt'] = {};
      if (query.from) filter['audit.createdAt'].$gte = new Date(query.from);
      if (query.to) filter['audit.createdAt'].$lte = new Date(query.to);
    }
    return filter;
  },

  listAllOrders(query) {
    return orderRepository.paginateOrders(
      this.buildAdminOrderFilter(query),
      stripPaginationMeta(query)
    );
  },

  /**
   * Counts and money totals for the orders the current filter selects, so the
   * cards above the admin order table describe the same set as the table.
   */
  async getAdminOrderStats(query = {}) {
    const filter = this.buildAdminOrderFilter(query);
    const [byOrderStatus, byPaymentStatus, totals] = await Promise.all([
      Order.aggregate([
        { $match: filter },
        { $group: { _id: '$orderStatus', count: { $sum: 1 }, valuePaise: { $sum: '$totalPaise' } } },
      ]),
      Order.aggregate([
        { $match: filter },
        { $group: { _id: '$paymentStatus', count: { $sum: 1 }, valuePaise: { $sum: '$totalPaise' } } },
      ]),
      Order.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            valuePaise: { $sum: '$totalPaise' },
            walletPaise: { $sum: '$walletAmountPaise' },
          },
        },
      ]),
    ]);

    const toMap = (rows) =>
      rows.reduce((acc, r) => {
        acc[r._id || 'unknown'] = { count: r.count, valuePaise: r.valuePaise };
        return acc;
      }, {});

    const orderStatus = toMap(byOrderStatus);
    const paymentStatus = toMap(byPaymentStatus);
    const pick = (map, keys) =>
      keys.reduce(
        (acc, k) => {
          acc.count += (map[k] && map[k].count) || 0;
          acc.valuePaise += (map[k] && map[k].valuePaise) || 0;
          return acc;
        },
        { count: 0, valuePaise: 0 }
      );

    // Value collected is only claimed for orders whose money is genuinely in
    // hand — summing order totals regardless of payment state is what made the
    // dashboard overstate what had been received.
    const paid = pick(paymentStatus, ['paid', 'partially_paid']);
    const awaitingPayment = pick(paymentStatus, ['pending', 'authorized']);
    const refunded = pick(paymentStatus, ['refunded', 'partially_refunded', 'refund_pending']);
    const delivered = pick(orderStatus, ['delivered']);
    const cancelled = pick(orderStatus, ['cancelled']);
    const inProgress = pick(orderStatus, [
      'placed',
      'accepted',
      'processed',
      'packed',
      'shipped',
      'out_for_delivery',
    ]);

    return {
      total: {
        count: (totals[0] && totals[0].count) || 0,
        valuePaise: (totals[0] && totals[0].valuePaise) || 0,
        walletPaise: (totals[0] && totals[0].walletPaise) || 0,
      },
      delivered,
      inProgress,
      cancelled,
      paid,
      awaitingPayment,
      refunded,
      orderStatus,
      paymentStatus,
    };
  },

  listSchoolPickupOrders(schoolId, query) {
    const filter = {};
    // Same rule as the admin list: a school must not be told to expect a delivery for
    // an order nobody has paid for.
    const pickupStatusFilter = query.status ? buildStatusFilter(query.status) : null;
    filter.orderStatus = pickupStatusFilter || { $ne: AWAITING_PAYMENT };
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search) {
      const or = buildSearchFilter(query.search);
      if (or) filter.$or = or;
    }
    if (query.from || query.to) {
      filter['audit.createdAt'] = {};
      if (query.from) filter['audit.createdAt'].$gte = new Date(query.from);
      if (query.to) filter['audit.createdAt'].$lte = new Date(query.to);
    }
    return orderRepository.paginateSchoolPickupOrders(schoolId, stripPaginationMeta(query), filter);
  },

  /**
   * Promote a paid online order into a real, placed order.
   *
   * This is the ONLY way a 'pending_payment' order becomes fulfilable, and it refuses
   * to run unless a captured payment covering the outstanding balance actually exists —
   * so it cannot be driven by a client simply calling the confirm endpoint. Safe to
   * call more than once: the client callback and the Razorpay webhook both land here,
   * and whichever arrives second is a no-op.
   */
  async activateOrder(orderId, { expectedPaidPaise = null } = {}) {
    const order = await Order.findById(orderId).lean();
    if (!order) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');
    if (order.orderStatus !== AWAITING_PAYMENT) return order;

    if (order.orderStatus === 'cancelled') {
      throw new BadRequestError('Order was cancelled', null, 'ORDER_CANCELLED');
    }

    // Trust the Payment collection, never the caller. The money owed to the gateway is
    // the total less whatever the wallet already covered.
    const owedPaise =
      expectedPaidPaise == null
        ? Math.max(0, (order.totalPaise || 0) - (order.walletAmountPaise || 0))
        : expectedPaidPaise;
    const capturedPaise = await paymentRepository.sumCapturedForOrder(orderId);
    if (capturedPaise < owedPaise) {
      throw new BadRequestError(
        'Order is not fully paid',
        null,
        'ORDER_NOT_PAID'
      );
    }

    // Conditional on still being unpaid, so two concurrent activations (client callback
    // racing the webhook) cannot both pass this point and double-run the effects.
    const promoted = await Order.findOneAndUpdate(
      { _id: orderId, orderStatus: AWAITING_PAYMENT },
      {
        $set: {
          orderStatus: 'placed',
          paymentStatus: 'paid',
          placedAt: new Date(),
          paymentExpiresAt: null,
        },
        $push: {
          statusHistory: { status: 'placed', at: new Date(), note: 'Payment received' },
        },
      },
      { new: true }
    ).lean();
    if (!promoted) return Order.findById(orderId).lean();

    await this.applyPlacementEffects(promoted, promoted.items || []);
    // Only now is the basket actually spent.
    await cartService.clearCart(promoted.userId, promoted.audience);

    return promoted;
  },

  /**
   * Release an online order that was never paid for, returning its stock to the shelf.
   * Without this, an abandoned checkout held its items out of stock permanently.
   */
  async expireUnpaidOrders({ now = new Date(), limit = 200 } = {}) {
    const stale = await Order.find({
      orderStatus: AWAITING_PAYMENT,
      paymentExpiresAt: { $lte: now },
    })
      .limit(limit)
      .lean();

    const expired = [];
    const reconciliationService = require('./reconciliation.service');

    for (const order of stale) {
      // Ask the gateway before destroying anything.
      //
      // This sweep used to cancel purely on a local timer, having never once
      // asked Razorpay whether the money had arrived. A customer who completed a
      // UPI collect request just as the timer ran out — or whose confirmation
      // callback never fired because they closed the tab — had their paid order
      // cancelled, their stock returned, and their money left sitting at the
      // gateway with nothing in this system recording it. Fifty-two production
      // orders were cancelled this way.
      //
      // syncPayment promotes the order itself when it finds a capture, so the
      // re-read below simply sees an order that is no longer awaiting payment.
      let syncResult;
      try {
        syncResult = await reconciliationService.syncOrder(order._id);
      } catch (syncError) {
        logger.warn('Unpaid sweep: gateway check failed, leaving order untouched', {
          orderNumber: order.orderNumber,
          error: syncError.message,
        });
        continue;
      }

      // syncPayment reports an unreachable gateway in its result rather than
      // throwing, so the result has to be inspected. Not being able to ask is
      // not evidence the customer failed to pay: cancelling on a failed lookup
      // would destroy exactly the orders this check exists to protect.
      const lookupFailed = (syncResult.payments || []).some((p) => p.error);
      if (lookupFailed) {
        logger.warn('Unpaid sweep: gateway did not answer, leaving order untouched', {
          orderNumber: order.orderNumber,
        });
        continue;
      }

      const recheck = await Order.findById(order._id).lean();
      if (!recheck || recheck.orderStatus !== AWAITING_PAYMENT) {
        // The gateway confirmed a payment and the order has been activated.
        logger.info('Unpaid sweep: order was actually paid, kept', {
          orderNumber: order.orderNumber,
        });
        continue;
      }

      // Conditional again: a payment landing at the same moment must win over the
      // sweeper, so the order is only cancelled while it is still unpaid.
      const cancelled = await Order.findOneAndUpdate(
        { _id: order._id, orderStatus: AWAITING_PAYMENT },
        {
          $set: {
            orderStatus: 'cancelled',
            paymentStatus: 'failed',
            cancellation: { at: new Date(), reason: 'Payment was not completed in time' },
          },
          $push: {
            statusHistory: {
              status: 'cancelled',
              at: new Date(),
              note: 'Payment not completed',
            },
          },
        },
        { new: true }
      ).lean();
      if (!cancelled) continue;

      await inventoryService.restoreStock(order.items || []);

      // The wallet portion was debited at creation, so it has to come back too.
      if (order.walletAmountPaise > 0) {
        try {
          await walletService.postTransaction(order.userId, {
            type: 'credit',
            category: 'order_refund',
            amountPaise: order.walletAmountPaise,
            reference: { kind: 'Order', id: order._id },
            description: `Wallet returned — payment not completed for ${order.orderNumber}`,
          });
        } catch (walletErr) {
          // A failed wallet return must not strand the rest of the sweep.
        }
      }
      expired.push(cancelled);
    }

    return expired;
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
