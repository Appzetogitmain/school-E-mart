const mongoose = require('mongoose');
const Order = require('../../../database/models/Order');
const Payment = require('../../../database/models/Payment');
const VendorLedger = require('../../../database/models/VendorLedger');
const SchoolLedger = require('../../../database/models/SchoolLedger');
const PlatformLedger = require('../../../database/models/PlatformLedger');
const PayoutRequest = require('../../../database/models/PayoutRequest');

/**
 * The admin panel's single source of financial truth.
 *
 * Every figure here is derived from money that actually moved — the Payment
 * collection and its gateway-reconciled state — rather than from order totals.
 *
 * That distinction is the whole point. The dashboard used to compute revenue as
 * the sum of `totalPaise` over orders that were both 'delivered' and 'paid'. In
 * production that matched two orders and reported Rs.1,200 of revenue while the
 * gateway had actually collected Rs.17,710, because eleven delivered orders
 * still carried an unconfirmed payment. An order total is what was *asked for*;
 * only a captured payment is what was *received*, and those are not the same
 * number.
 */

const ACTIVE = { 'softDelete.isDeleted': { $ne: true } };

// Order states that represent a real, live order. Anything else is either an
// abandoned checkout or a cancellation, and must never be counted as business.
const LIVE_ORDER_STATUSES = [
  'placed',
  'accepted',
  'processed',
  'packed',
  'shipped',
  'out_for_delivery',
  'delivered',
];

// Statuses in which the customer's money is genuinely in hand.
const PAID_STATUSES = ['paid', 'partially_paid', 'refunded', 'partially_refunded'];

const sumOf = async (Model, match, field) => {
  const [row] = await Model.aggregate([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` }, count: { $sum: 1 } } },
  ]);
  return { total: (row && row.total) || 0, count: (row && row.count) || 0 };
};

const financeService = {
  LIVE_ORDER_STATUSES,
  PAID_STATUSES,

  /**
   * Money in, money back, money still owed — the figures an operator needs to
   * be able to compare against the gateway dashboard without doing arithmetic.
   */
  async getMoneySummary() {
    const [captured, refundAgg, unresolved, mismatches] = await Promise.all([
      sumOf(Payment, { status: { $in: ['captured', 'partially_refunded', 'refunded'] } }, 'amountPaise'),
      // Only refunds the gateway has actually settled count as money returned.
      // Counting requested refunds here is what let the panel claim customers
      // had been paid back when the gateway was still holding the money.
      Payment.aggregate([
        { $unwind: '$refunds' },
        { $match: { 'refunds.status': 'processed' } },
        { $group: { _id: null, total: { $sum: '$refunds.amountPaise' }, count: { $sum: 1 } } },
      ]),
      sumOf(Payment, { status: { $in: ['initiated', 'authorized'] } }, 'amountPaise'),
      sumOf(Payment, { 'reconciliation.status': 'mismatch' }, 'amountPaise'),
    ]);

    const refundedPaise = (refundAgg[0] && refundAgg[0].total) || 0;
    const refundCount = (refundAgg[0] && refundAgg[0].count) || 0;

    // Refunds asked for but not yet settled by the gateway — money the business
    // has committed to returning and should not treat as its own.
    const [pendingRefundAgg] = await Payment.aggregate([
      { $unwind: '$refunds' },
      { $match: { 'refunds.status': { $in: ['requested', 'initiated', 'pending'] } } },
      { $group: { _id: null, total: { $sum: '$refunds.amountPaise' }, count: { $sum: 1 } } },
    ]);

    // Split by who actually holds the money. Cash on delivery is collected by
    // the courier and never appears on the gateway dashboard, so lumping it in
    // with gateway revenue makes the two impossible to compare — which is how
    // "Razorpay says one thing, the panel says another" starts.
    const byGateway = await Payment.aggregate([
      { $match: { status: { $in: ['captured', 'partially_refunded', 'refunded'] } } },
      {
        $group: {
          _id: { $cond: [{ $eq: ['$method', 'cod'] }, 'cod', { $ifNull: ['$gateway', 'unknown'] }] },
          total: { $sum: '$amountPaise' },
          count: { $sum: 1 },
        },
      },
    ]);
    const channels = {};
    for (const row of byGateway) {
      channels[row._id] = { collectedPaise: row.total, count: row.count };
    }

    return {
      grossCollectedPaise: captured.total,
      collectedPaymentCount: captured.count,
      // What the Razorpay dashboard should agree with, to the rupee.
      gatewayCollectedPaise: (channels.razorpay && channels.razorpay.collectedPaise) || 0,
      gatewayPaymentCount: (channels.razorpay && channels.razorpay.count) || 0,
      codCollectedPaise: (channels.cod && channels.cod.collectedPaise) || 0,
      codPaymentCount: (channels.cod && channels.cod.count) || 0,
      channels,
      refundedPaise,
      refundCount,
      refundInFlightPaise: (pendingRefundAgg && pendingRefundAgg.total) || 0,
      refundInFlightCount: (pendingRefundAgg && pendingRefundAgg.count) || 0,
      netRetainedPaise: captured.total - refundedPaise,
      // Payments that never reached a final state. Until each is checked against
      // the gateway, whether the customer was charged is unknown.
      unresolvedPaise: unresolved.total,
      unresolvedCount: unresolved.count,
      mismatchPaise: mismatches.total,
      mismatchCount: mismatches.count,
    };
  },

  /**
   * Money the business is holding that belongs to somebody else, or has earned
   * but not recorded. Each of these is a specific, fixable defect rather than a
   * statistic — so each carries the orders behind it.
   */
  async getExceptions({ limit = 50 } = {}) {
    // 1. Customers charged for an order that was then cancelled.
    const cancelledOrders = await Order.find({ ...ACTIVE, orderStatus: 'cancelled' })
      .select('_id orderNumber totalPaise walletAmountPaise cancellation userId address')
      .lean();
    const cancelledIds = cancelledOrders.map((o) => o._id);
    const capturedOnCancelled = await Payment.find({
      orderId: { $in: cancelledIds },
      status: { $in: ['captured', 'partially_refunded'] },
    })
      .select('orderId amountPaise gatewayPaymentId refunds status')
      .lean();

    const cancelledById = new Map(cancelledOrders.map((o) => [String(o._id), o]));
    const owedToCustomers = [];
    for (const p of capturedOnCancelled) {
      const settled = (p.refunds || [])
        .filter((r) => r.status === 'processed')
        .reduce((s, r) => s + (r.amountPaise || 0), 0);
      const outstanding = (p.amountPaise || 0) - settled;
      if (outstanding <= 0) continue;
      const order = cancelledById.get(String(p.orderId));
      owedToCustomers.push({
        orderId: p.orderId,
        orderNumber: order && order.orderNumber,
        customerName: order && order.address && order.address.name,
        customerPhone: order && order.address && order.address.phone,
        outstandingPaise: outstanding,
        gatewayPaymentId: p.gatewayPaymentId,
        cancelReason: order && order.cancellation && order.cancellation.reason,
        cancelledAt: order && order.cancellation && order.cancellation.at,
      });
    }
    owedToCustomers.sort((a, b) => b.outstandingPaise - a.outstandingPaise);

    // 2. Orders being fulfilled without a confirmed payment. These pay out
    //    vendor and school commission against revenue that may not exist.
    const unpaidFilter = {
      ...ACTIVE,
      orderStatus: { $in: LIVE_ORDER_STATUSES },
      paymentStatus: { $nin: PAID_STATUSES },
      paymentMethod: { $ne: 'cod' },
    };

    // The headline count and value must describe every matching order, not just
    // the page of rows shown underneath — deriving them from the limited query
    // made the dashboard card report the page size instead of the real total.
    const [unpaidTotals] = await Order.aggregate([
      { $match: unpaidFilter },
      { $group: { _id: null, totalPaise: { $sum: '$totalPaise' }, count: { $sum: 1 } } },
    ]);

    const deliveredUnpaid = await Order.find(unpaidFilter)
      .select('orderNumber orderStatus paymentStatus totalPaise placedAt address')
      .sort({ totalPaise: -1 })
      .limit(limit)
      .lean();

    return {
      owedToCustomers: {
        count: owedToCustomers.length,
        totalPaise: owedToCustomers.reduce((s, r) => s + r.outstandingPaise, 0),
        rows: owedToCustomers.slice(0, limit),
      },
      fulfilledUnpaid: {
        count: (unpaidTotals && unpaidTotals.count) || 0,
        totalPaise: (unpaidTotals && unpaidTotals.totalPaise) || 0,
        rows: deliveredUnpaid.map((o) => ({
          orderId: o._id,
          orderNumber: o.orderNumber,
          orderStatus: o.orderStatus,
          paymentStatus: o.paymentStatus,
          totalPaise: o.totalPaise,
          placedAt: o.placedAt,
          customerName: o.address && o.address.name,
          customerPhone: o.address && o.address.phone,
        })),
      },
    };
  },

  /** What has been promised to vendors and schools, and what has gone out. */
  async getPayables() {
    const [vendorCredit, vendorCommission, schoolCredit, platformCredit, payouts] =
      await Promise.all([
        sumOf(VendorLedger, { transactionType: 'order_credit' }, 'amountPaise'),
        sumOf(VendorLedger, { transactionType: 'commission_deduction' }, 'amountPaise'),
        sumOf(SchoolLedger, {}, 'amountPaise'),
        sumOf(PlatformLedger, {}, 'amountPaise'),
        PayoutRequest.aggregate([
          { $group: { _id: '$status', total: { $sum: '$amountPaise' }, count: { $sum: 1 } } },
        ]),
      ]);

    const byStatus = {};
    for (const row of payouts) {
      byStatus[row._id] = { totalPaise: row.total, count: row.count };
    }

    return {
      vendorEarningsPaise: vendorCredit.total,
      // Stored as negative deductions on the vendor ledger.
      vendorCommissionPaise: Math.abs(vendorCommission.total),
      schoolCommissionPaise: schoolCredit.total,
      platformCommissionPaise: platformCredit.total,
      payouts: {
        paidPaise: (byStatus.completed && byStatus.completed.totalPaise) || 0,
        paidCount: (byStatus.completed && byStatus.completed.count) || 0,
        pendingPaise: (byStatus.pending && byStatus.pending.totalPaise) || 0,
        pendingCount: (byStatus.pending && byStatus.pending.count) || 0,
        byStatus,
      },
    };
  },

  /**
   * Order counts that distinguish real business from noise.
   *
   * The dashboard previously showed a single "Total Orders" built from a bare
   * count, so 60 cancelled and abandoned checkouts were presented alongside 64
   * genuine orders as though all 124 were sales.
   */
  async getOrderCounts() {
    const rows = await Order.aggregate([
      { $match: ACTIVE },
      { $group: { _id: '$orderStatus', count: { $sum: 1 }, valuePaise: { $sum: '$totalPaise' } } },
    ]);
    const byStatus = {};
    for (const r of rows) byStatus[r._id] = { count: r.count, valuePaise: r.valuePaise };

    const pick = (statuses) =>
      statuses.reduce(
        (acc, s) => {
          acc.count += (byStatus[s] && byStatus[s].count) || 0;
          acc.valuePaise += (byStatus[s] && byStatus[s].valuePaise) || 0;
          return acc;
        },
        { count: 0, valuePaise: 0 }
      );

    const live = pick(LIVE_ORDER_STATUSES);
    return {
      byStatus,
      liveOrders: live.count,
      liveOrderValuePaise: live.valuePaise,
      delivered: (byStatus.delivered && byStatus.delivered.count) || 0,
      inProgress: pick(LIVE_ORDER_STATUSES.filter((s) => s !== 'delivered')).count,
      cancelled: (byStatus.cancelled && byStatus.cancelled.count) || 0,
      awaitingPayment: (byStatus.pending_payment && byStatus.pending_payment.count) || 0,
      returned: (byStatus.returned && byStatus.returned.count) || 0,
    };
  },

  /** Everything the finance view needs, in one round trip. */
  async getOverview({ limit = 25 } = {}) {
    const [money, exceptions, payables, orders] = await Promise.all([
      this.getMoneySummary(),
      this.getExceptions({ limit }),
      this.getPayables(),
      this.getOrderCounts(),
    ]);

    // Commission already booked against orders whose money never arrived — the
    // portion of payables that is not backed by collected revenue.
    const commissionAtRisk =
      exceptions.fulfilledUnpaid.count > 0 ? exceptions.fulfilledUnpaid.totalPaise : 0;

    return {
      money,
      exceptions,
      payables,
      orders,
      health: {
        // A single number an operator can watch: anything above zero means the
        // books and the gateway disagree somewhere.
        needsAttention:
          money.mismatchCount + exceptions.owedToCustomers.count + exceptions.fulfilledUnpaid.count,
        commissionAtRiskPaise: commissionAtRisk,
      },
      generatedAt: new Date().toISOString(),
    };
  },

  /**
   * Revenue over time, from captured payments rather than order totals, so the
   * trend line matches the gateway.
   */
  async getRevenueTrend({ days = 30 } = {}) {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await Payment.aggregate([
      {
        $match: {
          status: { $in: ['captured', 'partially_refunded', 'refunded'] },
          'audit.createdAt': { $gte: from },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$audit.createdAt' } },
          collectedPaise: { $sum: '$amountPaise' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r) => ({ date: r._id, collectedPaise: r.collectedPaise, count: r.count }));
  },
};

module.exports = financeService;
