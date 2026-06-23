const mongoose = require('mongoose');
const analyticsRepository = require('../repositories/analytics.repository');
const adminUserRepository = require('../repositories/user.repository');

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
      analyticsRepository.aggregateOrderRevenue({ orderStatus: 'delivered', paymentStatus: 'paid' }),
      analyticsRepository.countVendors({ approvalStatus: 'pending' }),
      analyticsRepository.countSchools({ partnerStatus: 'prospect' }),
      analyticsRepository.countCourses({ status: 'published' }),
      analyticsRepository.countUsers({ role: 'teacher', status: 'pending_approval' }),
      analyticsRepository.countLowStockProducts(),
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
        orders: totalOrders,
        revenuePaise: revenueAgg[0]?.totalRevenuePaise || 0,
        activeCourses,
        lowStockProducts,
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
