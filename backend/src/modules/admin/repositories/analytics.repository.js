const User = require('../../../database/models/User');
const School = require('../../../database/models/School');
const VendorProfile = require('../../../database/models/VendorProfile');
const Product = require('../../../database/models/Product');
const Order = require('../../../database/models/Order');
const LmsCourse = require('../../../database/models/LmsCourse');
const Student = require('../../../database/models/Student');
const ReturnRequest = require('../../../database/models/ReturnRequest');
const Category = require('../../../database/models/Category');

const activeFilter = { 'softDelete.isDeleted': { $ne: true } };

const analyticsRepository = {
  countUsers(filter = {}) {
    return User.countDocuments({ ...activeFilter, ...filter });
  },

  countSchools(filter = {}) {
    return School.countDocuments({ ...activeFilter, ...filter });
  },

  countVendors(filter = {}) {
    return VendorProfile.countDocuments({ ...activeFilter, ...filter });
  },

  countProducts(filter = {}) {
    return Product.countDocuments({ ...activeFilter, ...filter });
  },

  countOrders(filter = {}) {
    return Order.countDocuments({ ...activeFilter, ...filter });
  },

  countCourses(filter = {}) {
    return LmsCourse.countDocuments({ ...activeFilter, ...filter });
  },

  countStudents(filter = {}) {
    return Student.countDocuments({ ...activeFilter, ...filter });
  },

  aggregateOrderRevenue(match = {}) {
    return Order.aggregate([
      { $match: { ...activeFilter, ...match } },
      {
        $group: {
          _id: null,
          totalRevenuePaise: { $sum: '$totalPaise' },
          orderCount: { $sum: 1 },
        },
      },
    ]);
  },

  aggregateOrdersByDay(from, to) {
    const match = { ...activeFilter };
    if (from || to) {
      match['audit.createdAt'] = {};
      if (from) match['audit.createdAt'].$gte = new Date(from);
      if (to) match['audit.createdAt'].$lte = new Date(to);
    }
    return Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$audit.createdAt' } },
          count: { $sum: 1 },
          revenuePaise: { $sum: '$totalPaise' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  aggregateOrdersByMonth(from, to) {
    const match = { ...activeFilter };
    if (from || to) {
      match['audit.createdAt'] = {};
      if (from) match['audit.createdAt'].$gte = new Date(from);
      if (to) match['audit.createdAt'].$lte = new Date(to);
    }
    return Order.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$audit.createdAt' } },
          count: { $sum: 1 },
          revenuePaise: { $sum: '$totalPaise' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  aggregateOrdersByStatus() {
    return Order.aggregate([
      { $match: activeFilter },
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);
  },

  aggregateUserGrowth(from, to) {
    const match = { ...activeFilter };
    if (from || to) {
      match['audit.createdAt'] = {};
      if (from) match['audit.createdAt'].$gte = new Date(from);
      if (to) match['audit.createdAt'].$lte = new Date(to);
    }
    return User.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$audit.createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  aggregateUsersByRole() {
    return User.aggregate([
      { $match: activeFilter },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
  },

  aggregateProductStats() {
    return Product.aggregate([
      { $match: activeFilter },
      {
        $group: {
          _id: '$approvalStatus',
          count: { $sum: 1 },
          totalStock: { $sum: '$stock' },
        },
      },
    ]);
  },

  aggregateCategoryStats() {
    return Product.aggregate([
      { $match: activeFilter },
      {
        $group: {
          _id: '$categoryId',
          productCount: { $sum: 1 },
          totalSales: { $sum: '$salesCount' },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 20 },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]);
  },

  getBestSellingProducts(limit = 10) {
    return Product.find(activeFilter)
      .sort({ salesCount: -1 })
      .limit(limit)
      .select('name sku salesCount pricePaise vendorId categoryId stock')
      .lean();
  },

  getTopVendors(limit = 10) {
    return Order.aggregate([
      { $match: { ...activeFilter, orderStatus: 'delivered' } },
      { $unwind: '$vendorIds' },
      {
        $group: {
          _id: '$vendorIds',
          orderCount: { $sum: 1 },
          revenuePaise: { $sum: '$totalPaise' },
        },
      },
      { $sort: { revenuePaise: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'vendorProfiles',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
    ]);
  },

  aggregateReturnStats(from, to) {
    const match = { ...activeFilter };
    if (from || to) {
      match['audit.createdAt'] = {};
      if (from) match['audit.createdAt'].$gte = new Date(from);
      if (to) match['audit.createdAt'].$lte = new Date(to);
    }
    return ReturnRequest.aggregate([
      { $match: match },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },

  aggregateSchoolRegistrations(from, to) {
    const match = { ...activeFilter };
    if (from || to) {
      match['audit.createdAt'] = {};
      if (from) match['audit.createdAt'].$gte = new Date(from);
      if (to) match['audit.createdAt'].$lte = new Date(to);
    }
    return School.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$audit.createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  },

  aggregateLmsActivity() {
    return LmsCourse.aggregate([
      { $match: activeFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  },

  aggregateVendorApprovalStats() {
    return VendorProfile.aggregate([
      { $match: activeFilter },
      { $group: { _id: '$approvalStatus', count: { $sum: 1 } } },
    ]);
  },

  aggregateVendorSales(from, to) {
    const match = { ...activeFilter, orderStatus: 'delivered' };
    if (from || to) {
      match['audit.createdAt'] = {};
      if (from) match['audit.createdAt'].$gte = new Date(from);
      if (to) match['audit.createdAt'].$lte = new Date(to);
    }
    return Order.aggregate([
      { $match: match },
      { $unwind: '$vendorIds' },
      {
        $group: {
          _id: '$vendorIds',
          orders: { $sum: 1 },
          revenuePaise: { $sum: '$totalPaise' },
        },
      },
      { $sort: { revenuePaise: -1 } },
      { $limit: 20 },
    ]);
  },

  countTeachers() {
    return User.countDocuments({ ...activeFilter, role: 'teacher' });
  },

  countLowStockProducts() {
    return Product.countDocuments({
      ...activeFilter,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    });
  },

  getRecentOrders(limit = 10) {
    return Order.find(activeFilter)
      .sort({ 'audit.createdAt': -1 })
      .limit(limit)
      .select('orderNumber userId orderStatus totalPaise paymentStatus audit.createdAt')
      .lean();
  },

  countCategories() {
    return Category.countDocuments(activeFilter);
  },
};

module.exports = analyticsRepository;
