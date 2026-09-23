const mongoose = require('mongoose');
const analyticsRepository = require('../repositories/analytics.repository');
const adminUserRepository = require('../repositories/user.repository');
const financeService = require('./finance.service');

const dashboardService = {
  async getOverview() {
    const [
      totalUsers,
      totalParents,
      totalStudents,
      totalTeachers,
      totalSchools,
      totalVendors,
      totalProducts,
      totalOrders,
      revenueAgg,
      pendingVendors,
      pendingSchools,
      activeCourses,
      pendingTeachers,
      lowStockProducts,
    ] = await Promise.all([
      analyticsRepository.countUsers(),
      analyticsRepository.countUsers({ role: 'parent' }),
      analyticsRepository.countStudents(),
      analyticsRepository.countTeachers(),
      analyticsRepository.countSchools(),
      analyticsRepository.countVendors(),
      analyticsRepository.countProducts(),
      analyticsRepository.countOrders(),
      // Replaced by real money below. Kept in the fetch so the array shape and
      // every downstream index stay unchanged.
      Promise.resolve([]),
      analyticsRepository.countVendors({ approvalStatus: 'pending' }),
      analyticsRepository.countSchools({ partnerStatus: 'prospect' }),
      analyticsRepository.countCourses({ status: 'published' }),
      analyticsRepository.countUsers({ role: 'teacher', status: 'pending_approval' }),
      analyticsRepository.countLowStockProducts(),
    ]);

    // Order counts and revenue both used to be wrong in the same direction, for
    // opposite reasons.
    //
    // "Total Orders" was a bare count, so 60 cancelled and abandoned checkouts
    // were presented next to 64 real orders as though all 124 were sales.
    //
    // Revenue was the sum of order totals where the order was both 'delivered'
    // AND 'paid'. In production only two orders satisfied both, so the card read
    // Rs.1,200 while the gateway had taken Rs.17,710 — because eleven delivered
    // orders still carried an unconfirmed payment. Revenue now comes from
    // captured payments, which is money that demonstrably arrived.
    const [money, orderCounts] = await Promise.all([
      financeService.getMoneySummary(),
      financeService.getOrderCounts(),
    ]);

    return {
      totals: {
        users: totalUsers,
        parents: totalParents,
        students: totalStudents,
        teachers: totalTeachers,
        schools: totalSchools,
        vendors: totalVendors,
        products: totalProducts,
        // Real orders only. `allOrders` keeps the raw figure available for
        // anywhere that genuinely wants every record, cancellations included.
        orders: orderCounts.liveOrders,
        allOrders: totalOrders,
        cancelledOrders: orderCounts.cancelled,
        awaitingPaymentOrders: orderCounts.awaitingPayment,
        deliveredOrders: orderCounts.delivered,
        inProgressOrders: orderCounts.inProgress,
        revenuePaise: money.netRetainedPaise,
        activeCourses,
        lowStockProducts,
      },
      // The money block, so the dashboard can show collected/refunded/owed
      // without a second request.
      money: {
        grossCollectedPaise: money.grossCollectedPaise,
        gatewayCollectedPaise: money.gatewayCollectedPaise,
        codCollectedPaise: money.codCollectedPaise,
        refundedPaise: money.refundedPaise,
        refundInFlightPaise: money.refundInFlightPaise,
        netRetainedPaise: money.netRetainedPaise,
        unresolvedPaise: money.unresolvedPaise,
        unresolvedCount: money.unresolvedCount,
        mismatchCount: money.mismatchCount,
      },
      pendingApprovals: {
        vendors: pendingVendors,
        schools: pendingSchools,
        teachers: pendingTeachers,
        total: pendingVendors + pendingSchools + pendingTeachers,
      },
    };
  },

  async getRecentRegistrations(limit = 10) {
    return adminUserRepository.getRecentRegistrations(limit);
  },

  async getRecentOrders(limit = 10) {
    return analyticsRepository.getRecentOrders(limit);
  },

  async getSystemHealth() {
    const dbState = mongoose.connection.readyState;
    const dbStatusMap = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      database: {
        status: dbStatusMap[dbState] || 'unknown',
        healthy: dbState === 1,
      },
      api: {
        status: 'operational',
        healthy: true,
      },
      checkedAt: new Date().toISOString(),
    };
  },
};

module.exports = dashboardService;
