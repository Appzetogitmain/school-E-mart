const Product = require('../../../database/models/Product');
const Order = require('../../../database/models/Order');
const ReturnRequest = require('../../../database/models/ReturnRequest');
const VendorLedger = require('../../../database/models/VendorLedger');
const settlementService = require('./settlement.service');

const analyticsService = {
  async getDashboard(vendorId) {
    const [
      productStats,
      orderStats,
      returnStats,
      earnings,
      lowStockCount,
      topProducts,
    ] = await Promise.all([
      this.getProductStats(vendorId),
      this.getOrderStats(vendorId),
      this.getReturnStats(vendorId),
      settlementService.getEarningsSummary(vendorId),
      this.countLowStock(vendorId),
      this.getTopSellingProducts(vendorId, 5),
    ]);

    const returnRate =
      orderStats.ordersCompleted > 0
        ? Number(((returnStats.totalReturns / orderStats.ordersCompleted) * 100).toFixed(2))
        : 0;

    return {
      products: productStats,
      orders: orderStats,
      returns: { ...returnStats, returnRate },
      revenue: {
        totalEarningsPaise: earnings.totalEarningsPaise,
        netEarningsPaise: earnings.netEarningsPaise,
        totalCommissionPaise: earnings.totalCommissionPaise,
      },
      settlement: {
        availableBalancePaise: earnings.availableBalancePaise,
        pendingSettlementPaise: earnings.pendingSettlementPaise,
        totalPayoutsPaise: earnings.totalPayoutsPaise,
      },
      lowStockProducts: lowStockCount,
      topSellingProducts: topProducts,
    };
  },

  async getProductStats(vendorId) {
    const baseFilter = {
      vendorId,
      'softDelete.isDeleted': { $ne: true },
    };
    const [total, active] = await Promise.all([
      Product.countDocuments(baseFilter),
      Product.countDocuments({
        ...baseFilter,
        approvalStatus: 'approved',
        publishStatus: 'published',
      }),
    ]);
    return { totalProducts: total, activeProducts: active };
  },

  /**
   * A vendor's order counts, and what those orders are actually worth to them.
   *
   * Two things were wrong here. An unpaid online order — one still sitting at
   * 'pending_payment', which no vendor is ever shown and may never be paid for —
   * was counted in `ordersReceived`, so the vendor's own figures disagreed with
   * the order list in front of them. And "revenue" summed `totalPaise`, the
   * whole order value including delivery, platform fee and other vendors' lines,
   * which is not money the vendor is owed. Vendors settle on their own line
   * items less commission, so that is what is reported.
   */
  async getOrderStats(vendorId) {
    const baseMatch = {
      vendorIds: vendorId,
      'softDelete.isDeleted': { $ne: true },
      // An order nobody has paid for is not an order the vendor has received.
      orderStatus: { $ne: 'pending_payment' },
    };
    const results = await Order.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    // The vendor's own share of delivered orders: their line items only.
    const [grossRow] = await Order.aggregate([
      { $match: { ...baseMatch, orderStatus: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.vendorId': vendorId } },
      { $group: { _id: null, grossPaise: { $sum: '$items.lineTotalPaise' } } },
    ]);

    const stats = {
      ordersReceived: 0,
      ordersCompleted: 0,
      ordersCancelled: 0,
      ordersInProgress: 0,
      // Their line items on delivered orders, before commission.
      grossSalesPaise: (grossRow && grossRow.grossPaise) || 0,
      // Kept under the previous name so existing screens keep working, but now
      // it means the vendor's own sales rather than the whole order value.
      revenuePaise: (grossRow && grossRow.grossPaise) || 0,
    };

    results.forEach((row) => {
      stats.ordersReceived += row.count;
      if (row._id === 'delivered') {
        stats.ordersCompleted = row.count;
      } else if (row._id === 'cancelled') {
        stats.ordersCancelled = row.count;
      } else if (!['returned'].includes(row._id)) {
        stats.ordersInProgress += row.count;
      }
    });

    return stats;
  },

  async getReturnStats(vendorId) {
    const baseMatch = { vendorId, 'softDelete.isDeleted': { $ne: true } };
    const results = await ReturnRequest.aggregate([
      { $match: baseMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const stats = { totalReturns: 0, requested: 0, approved: 0, rejected: 0, completed: 0 };
    results.forEach((row) => {
      stats.totalReturns += row.count;
      if (row._id === 'requested') stats.requested = row.count;
      if (row._id === 'approved') stats.approved = row.count;
      if (row._id === 'rejected') stats.rejected = row.count;
      if (row._id === 'completed') stats.completed = row.count;
    });
    return stats;
  },

  async countLowStock(vendorId) {
    return Product.countDocuments({
      vendorId,
      'softDelete.isDeleted': { $ne: true },
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    });
  },

  async getTopSellingProducts(vendorId, limit = 5) {
    return Product.find({
      vendorId,
      'softDelete.isDeleted': { $ne: true },
    })
      .sort({ salesCount: -1 })
      .limit(limit)
      .select('name sku salesCount pricePaise stock')
      .lean();
  },

  async getRevenueSummary(vendorId, { from, to } = {}) {
    const match = {
      vendorIds: vendorId,
      orderStatus: 'delivered',
      'softDelete.isDeleted': { $ne: true },
    };
    if (from || to) {
      match['audit.createdAt'] = {};
      if (from) match['audit.createdAt'].$gte = new Date(from);
      if (to) match['audit.createdAt'].$lte = new Date(to);
    }

    const [orderRevenue, ledgerSummary] = await Promise.all([
      Order.aggregate([
        { $match: match },
        { $group: { _id: null, totalPaise: { $sum: '$totalPaise' }, count: { $sum: 1 } } },
      ]),
      settlementService.getEarningsSummary(vendorId),
    ]);

    return {
      orderRevenuePaise: orderRevenue[0]?.totalPaise || 0,
      deliveredOrders: orderRevenue[0]?.count || 0,
      ...ledgerSummary,
    };
  },
};

module.exports = analyticsService;
