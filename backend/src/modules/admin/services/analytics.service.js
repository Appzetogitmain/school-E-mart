const analyticsRepository = require('../repositories/analytics.repository');
const adminUserRepository = require('../repositories/user.repository');

const mapCountResults = (results) =>
  results.reduce((acc, row) => {
    acc[row._id || 'unknown'] = row.count;
    return acc;
  }, {});

const analyticsService = {
  async getUserAnalytics(query = {}) {
    const { from, to } = query;
    const [growth, byRole, byStatus, totalUsers] = await Promise.all([
      analyticsRepository.aggregateUserGrowth(from, to),
      analyticsRepository.aggregateUsersByRole(),
      adminUserRepository.countByStatus(),
      analyticsRepository.countUsers(),
    ]);

    const activeUsers = await analyticsRepository.countUsers({ status: 'active' });

    return {
      totalUsers,
      activeUsers,
      userGrowth: growth.map((row) => ({ date: row._id, count: row.count })),
      registrationTrends: growth.map((row) => ({ date: row._id, registrations: row.count })),
      distributionByRole: mapCountResults(byRole),
      distributionByStatus: mapCountResults(byStatus),
    };
  },

  async getMarketplaceAnalytics(query = {}) {
    const [productStats, categoryStats, bestSelling, topVendors, inventorySummary] =
      await Promise.all([
        analyticsRepository.aggregateProductStats(),
        analyticsRepository.aggregateCategoryStats(),
        analyticsRepository.getBestSellingProducts(query.limit || 10),
        analyticsRepository.getTopVendors(query.limit || 10),
        analyticsRepository.countLowStockProducts(),
      ]);

    const productStatistics = mapCountResults(
      productStats.map((row) => ({ _id: row._id, count: row.count }))
    );
    const totalStock = productStats.reduce((sum, row) => sum + (row.totalStock || 0), 0);

    return {
      productStatistics,
      categoryStatistics: categoryStats.map((row) => ({
        categoryId: row._id,
        categoryName: row.category?.name || null,
        productCount: row.productCount,
        totalSales: row.totalSales,
      })),
      inventorySummary: {
        totalStock,
        lowStockProducts: inventorySummary,
        byApprovalStatus: productStatistics,
      },
      bestSellingProducts: bestSelling,
      topVendors,
    };
  },

  async getOrderAnalytics(query = {}) {
    const { from, to } = query;
    const [byDay, byMonth, byStatus, returnStats, revenueAgg] = await Promise.all([
      analyticsRepository.aggregateOrdersByDay(from, to),
      analyticsRepository.aggregateOrdersByMonth(from, to),
      analyticsRepository.aggregateOrdersByStatus(),
      analyticsRepository.aggregateReturnStats(from, to),
      analyticsRepository.aggregateOrderRevenue({
        orderStatus: 'delivered',
        ...(from || to
          ? {
              'audit.createdAt': {
                ...(from ? { $gte: new Date(from) } : {}),
                ...(to ? { $lte: new Date(to) } : {}),
              },
            }
          : {}),
      }),
    ]);

    const statusMap = mapCountResults(byStatus);
    const totalOrders = Object.values(statusMap).reduce((sum, c) => sum + c, 0);
    const cancelled = statusMap.cancelled || 0;
    const delivered = statusMap.delivered || 0;
    const returnMap = mapCountResults(returnStats);
    const totalReturns = Object.values(returnMap).reduce((sum, c) => sum + c, 0);

    return {
      ordersPerDay: byDay.map((row) => ({
        date: row._id,
        count: row.count,
        revenuePaise: row.revenuePaise,
      })),
      ordersPerMonth: byMonth.map((row) => ({
        month: row._id,
        count: row.count,
        revenuePaise: row.revenuePaise,
      })),
      revenueTrends: byMonth.map((row) => ({
        period: row._id,
        revenuePaise: row.revenuePaise,
      })),
      cancellationRate: totalOrders > 0 ? Number(((cancelled / totalOrders) * 100).toFixed(2)) : 0,
      returnRate: delivered > 0 ? Number(((totalReturns / delivered) * 100).toFixed(2)) : 0,
      refundStatistics: returnMap,
      orderStatusBreakdown: statusMap,
      totalRevenuePaise: revenueAgg[0]?.totalRevenuePaise || 0,
    };
  },

  async getSchoolAnalytics(query = {}) {
    const { from, to } = query;
    const [registrations, studentCount, teacherCount, lmsActivity] = await Promise.all([
      analyticsRepository.aggregateSchoolRegistrations(from, to),
      analyticsRepository.countStudents(),
      analyticsRepository.countTeachers(),
      analyticsRepository.aggregateLmsActivity(),
    ]);

    return {
      schoolRegistrations: registrations.map((row) => ({
        month: row._id,
        count: row.count,
      })),
      studentCount,
      teacherCount,
      lmsActivity: mapCountResults(lmsActivity),
    };
  },

  async getVendorAnalytics(query = {}) {
    const { from, to } = query;
    const [approvalStats, salesSummary, topVendors, productStats] = await Promise.all([
      analyticsRepository.aggregateVendorApprovalStats(),
      analyticsRepository.aggregateVendorSales(from, to),
      analyticsRepository.getTopVendors(query.limit || 10),
      analyticsRepository.aggregateProductStats(),
    ]);

    return {
      approvalStatistics: mapCountResults(approvalStats),
      salesSummary,
      topVendors,
      vendorPerformance: topVendors,
      productPerformance: productStats,
    };
  },
};

module.exports = analyticsService;
