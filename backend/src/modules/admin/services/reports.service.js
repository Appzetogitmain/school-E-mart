const User = require('../../../database/models/User');
const School = require('../../../database/models/School');
const VendorProfile = require('../../../database/models/VendorProfile');
const Order = require('../../../database/models/Order');
const Product = require('../../../database/models/Product');
const ReturnRequest = require('../../../database/models/ReturnRequest');
const { executePaginatedQuery } = require('../../../repositories/query');

const activeFilter = { 'softDelete.isDeleted': { $ne: true } };

const buildDateFilter = (query, field = 'audit.createdAt') => {
  if (!query.from && !query.to) return {};
  const filter = {};
  filter[field] = {};
  if (query.from) filter[field].$gte = new Date(query.from);
  if (query.to) filter[field].$lte = new Date(query.to);
  return filter;
};

const buildExportMeta = (query, reportType) => ({
  reportType,
  generatedAt: new Date().toISOString(),
  dateRange: { from: query.from || null, to: query.to || null },
  filters: {
    search: query.search || query.q || null,
    status: query.status || null,
    role: query.role || null,
    sort: query.sort || null,
  },
  format: 'json',
});

const reportsService = {
  async getUserReport(query) {
    const filter = { ...activeFilter, ...buildDateFilter(query) };
    if (query.role) filter.role = query.role;
    if (query.status) filter.status = query.status;
    if (query.search || query.q) {
      const term = query.search || query.q;
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { refId: { $regex: term, $options: 'i' } },
      ];
    }
    const result = await executePaginatedQuery(User, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    return { ...result, exportMeta: buildExportMeta(query, 'users') };
  },

  async getVendorReport(query) {
    const filter = { ...activeFilter, ...buildDateFilter(query) };
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
    if (query.search || query.q) {
      const term = query.search || query.q;
      filter.$or = [
        { storeName: { $regex: term, $options: 'i' } },
        { storeSlug: { $regex: term, $options: 'i' } },
      ];
    }
    const result = await executePaginatedQuery(VendorProfile, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    return { ...result, exportMeta: buildExportMeta(query, 'vendors') };
  },

  async getSchoolReport(query) {
    const filter = { ...activeFilter, ...buildDateFilter(query) };
    if (query.partnerStatus) filter.partnerStatus = query.partnerStatus;
    if (query.search || query.q) {
      const term = query.search || query.q;
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } },
      ];
    }
    const result = await executePaginatedQuery(School, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    return { ...result, exportMeta: buildExportMeta(query, 'schools') };
  },

  async getOrderReport(query) {
    const filter = { ...activeFilter, ...buildDateFilter(query) };
    if (query.orderStatus) filter.orderStatus = query.orderStatus;
    if (query.paymentStatus) filter.paymentStatus = query.paymentStatus;
    if (query.search || query.q) {
      filter.orderNumber = { $regex: query.search || query.q, $options: 'i' };
    }
    const result = await executePaginatedQuery(Order, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    return { ...result, exportMeta: buildExportMeta(query, 'orders') };
  },

  async getSalesReport(query) {
    const filter = {
      ...activeFilter,
      ...buildDateFilter(query),
      orderStatus: 'delivered',
    };
    const result = await executePaginatedQuery(Order, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    const totalRevenuePaise = result.data.reduce((sum, o) => sum + (o.totalPaise || 0), 0);
    return {
      ...result,
      summary: { totalRevenuePaise, orderCount: result.data.length },
      exportMeta: buildExportMeta(query, 'sales'),
    };
  },

  async getRefundReport(query) {
    const filter = { ...activeFilter, ...buildDateFilter(query) };
    if (query.status) filter.status = query.status;
    const result = await executePaginatedQuery(ReturnRequest, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    return { ...result, exportMeta: buildExportMeta(query, 'refunds') };
  },

  async getReturnReport(query) {
    const filter = { ...activeFilter, ...buildDateFilter(query) };
    if (query.status) filter.status = query.status;
    const result = await executePaginatedQuery(ReturnRequest, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    return { ...result, exportMeta: buildExportMeta(query, 'returns') };
  },

  async getInventoryReport(query) {
    const filter = { ...activeFilter, ...buildDateFilter(query) };
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
    if (query.search || query.q) {
      const term = query.search || query.q;
      filter.$or = [{ name: { $regex: term, $options: 'i' } }, { sku: { $regex: term, $options: 'i' } }];
    }
    const result = await executePaginatedQuery(Product, filter, query, {
      defaultSort: '-audit.updatedAt',
    });
    const lowStock = result.data.filter((p) => p.stock <= (p.lowStockThreshold || 0)).length;
    return {
      ...result,
      summary: { lowStockCount: lowStock },
      exportMeta: buildExportMeta(query, 'inventory'),
    };
  },

  async getComprehensiveCommissionReport(query) {
    const term = (query.search || query.q || '').trim();
    const searchRegex = term ? new RegExp(term, 'i') : null;

    // 1. Fetch live Schools
    const schools = await School.find({ ...activeFilter }).lean();

    // 2. Fetch live Vendors
    const vendors = await VendorProfile.find({ ...activeFilter }).lean();

    // 3. Aggregate all non-cancelled orders for overall commission calculation
    const allOrderItems = await Order.aggregate([
      {
        $match: {
          'softDelete.isDeleted': { $ne: true },
          orderStatus: { $ne: 'cancelled' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'buyerUser',
        },
      },
      { $unwind: '$items' },
      {
        $project: {
          orderNumber: 1,
          audience: 1,
          vendorId: '$items.vendorId',
          schoolId: {
            $ifNull: [
              '$items.schoolId',
              '$schoolId',
              { $arrayElemAt: ['$buyerUser.schoolId', 0] },
              { $arrayElemAt: ['$buyerUser.studentDetails.schoolId', 0] },
            ],
          },
          isKit: { $cond: [{ $ifNull: ['$items.kitId', false] }, true, false] },
          subtotalPaise: {
            $ifNull: [
              '$items.subtotalPaise',
              { $multiply: ['$items.pricePaise', '$items.quantity'] },
            ],
          },
          adminPercent: { $ifNull: ['$items.commission.adminPercent', 10] },
          schoolPercent: '$items.commission.schoolPercent',
        },
      },
    ]);

    const schoolMap = new Map(schools.map((s) => [String(s._id), s]));

    let totalGrossSalesPaise = 0;
    let totalAdminCommissionPaise = 0;
    let totalSchoolCommissionPaise = 0;
    let totalVendorPayoutPaise = 0;
    const orderNumbersSet = new Set();

    const schoolStatsMap = new Map();
    const vendorStatsMap = new Map();

    const channelStats = {
      kits: { salesPaise: 0, adminPaise: 0, schoolPaise: 0, vendorPaise: 0 },
      retail: { salesPaise: 0, adminPaise: 0, schoolPaise: 0, vendorPaise: 0 },
    };

    const parseNum = (val, defaultVal = 0) => {
      if (val === null || val === undefined) return defaultVal;
      if (typeof val === 'object' && val.$numberDecimal !== undefined) {
        val = val.$numberDecimal;
      }
      const n = Number(val);
      return Number.isFinite(n) ? n : defaultVal;
    };

    for (const item of allOrderItems) {
      const subtotal = parseNum(item.subtotalPaise, 0);
      const adminP = parseNum(item.adminPercent, 10);
      
      let schoolP = item.schoolPercent !== undefined && item.schoolPercent !== null 
        ? parseNum(item.schoolPercent, null) 
        : null;

      if (schoolP === null) {
        if (item.schoolId) {
          const sDoc = schoolMap.get(String(item.schoolId));
          if (sDoc) {
            schoolP = item.isKit
              ? parseNum(sDoc.commission?.kitPercent, 5)
              : parseNum(sDoc.commission?.retailPercent, 2);
          } else {
            schoolP = item.isKit ? 5 : 2;
          }
        } else {
          schoolP = 0;
        }
      }

      const vendorP = Math.max(0, 100 - adminP - schoolP);

      const adminAmt = Math.round((subtotal * adminP) / 100);
      const schoolAmt = Math.round((subtotal * schoolP) / 100);
      const vendorAmt = Math.round((subtotal * vendorP) / 100);

      totalGrossSalesPaise += subtotal;
      totalAdminCommissionPaise += adminAmt;
      totalSchoolCommissionPaise += schoolAmt;
      totalVendorPayoutPaise += vendorAmt;
      if (item.orderNumber) orderNumbersSet.add(item.orderNumber);

      if (item.isKit) {
        channelStats.kits.salesPaise += subtotal;
        channelStats.kits.adminPaise += adminAmt;
        channelStats.kits.schoolPaise += schoolAmt;
        channelStats.kits.vendorPaise += vendorAmt;
      } else {
        channelStats.retail.salesPaise += subtotal;
        channelStats.retail.adminPaise += adminAmt;
        channelStats.retail.schoolPaise += schoolAmt;
        channelStats.retail.vendorPaise += vendorAmt;
      }

      // School accumulator
      if (item.schoolId) {
        const sid = String(item.schoolId);
        if (!schoolStatsMap.has(sid)) {
          schoolStatsMap.set(sid, { orderNumbers: new Set(), salesPaise: 0, adminPaise: 0, schoolPaise: 0 });
        }
        const sStat = schoolStatsMap.get(sid);
        if (item.orderNumber) sStat.orderNumbers.add(item.orderNumber);
        sStat.salesPaise += subtotal;
        sStat.adminPaise += adminAmt;
        sStat.schoolPaise += schoolAmt;
      }

      // Vendor accumulator
      if (item.vendorId) {
        const vid = String(item.vendorId);
        if (!vendorStatsMap.has(vid)) {
          vendorStatsMap.set(vid, { orderNumbers: new Set(), salesPaise: 0, adminPaise: 0, vendorPaise: 0 });
        }
        const vStat = vendorStatsMap.get(vid);
        if (item.orderNumber) vStat.orderNumbers.add(item.orderNumber);
        vStat.salesPaise += subtotal;
        vStat.adminPaise += adminAmt;
        vStat.vendorPaise += vendorAmt;
      }
    }

    // Process Schools List
    let enrichedSchools = schools.map((s) => {
      const sid = String(s._id);
      const st = schoolStatsMap.get(sid) || { orderNumbers: new Set(), salesPaise: 0, adminPaise: 0, schoolPaise: 0 };
      return {
        _id: s._id,
        id: s._id,
        name: s.name,
        code: s.code,
        logo: s.logoUrl || s.logo?.url || '',
        city: s.contact?.city || s.address?.city || '',
        state: s.contact?.state || s.address?.state || '',
        partnerStatus: s.partnerStatus || 'active',
        commissionConfig: {
          retailPercent: parseNum(s.commission?.retailPercent, 0),
          kitPercent: parseNum(s.commission?.kitPercent, 0),
        },
        metrics: {
          ordersCount: st.orderNumbers.size,
          salesRupees: (st.salesPaise / 100).toFixed(2),
          adminCommissionRupees: (st.adminPaise / 100).toFixed(2),
          schoolCommissionRupees: (st.schoolPaise / 100).toFixed(2),
        },
      };
    });

    if (searchRegex) {
      enrichedSchools = enrichedSchools.filter(
        (s) => searchRegex.test(s.name) || searchRegex.test(s.code) || searchRegex.test(s.city)
      );
    }

    // Process Vendors List
    let enrichedVendors = vendors.map((v) => {
      const vid = String(v._id);
      const vt = vendorStatsMap.get(vid) || { orderNumbers: new Set(), salesPaise: 0, adminPaise: 0, vendorPaise: 0 };
      return {
        _id: v._id,
        id: v._id,
        storeName: v.storeName || 'Vendor Store',
        storeSlug: v.storeSlug || '',
        logo: v.storeLogoUrl || v.logoUrl || '',
        approvalStatus: v.approvalStatus || 'approved',
        commissionConfig: {
          commissionPercent: parseNum(v.commissionPercent, 10),
        },
        metrics: {
          ordersCount: vt.orderNumbers.size,
          salesRupees: (vt.salesPaise / 100).toFixed(2),
          adminCommissionRupees: (vt.adminPaise / 100).toFixed(2),
          vendorNetPayoutRupees: (vt.vendorPaise / 100).toFixed(2),
        },
      };
    });

    if (searchRegex) {
      enrichedVendors = enrichedVendors.filter(
        (v) => searchRegex.test(v.storeName) || searchRegex.test(v.storeSlug)
      );
    }

    const effectiveAdminP = totalGrossSalesPaise > 0 ? ((totalAdminCommissionPaise / totalGrossSalesPaise) * 100).toFixed(1) : '10.0';
    const effectiveSchoolP = totalGrossSalesPaise > 0 ? ((totalSchoolCommissionPaise / totalGrossSalesPaise) * 100).toFixed(1) : '0.0';
    const effectiveVendorP = totalGrossSalesPaise > 0 ? ((totalVendorPayoutPaise / totalGrossSalesPaise) * 100).toFixed(1) : '90.0';

    return {
      overview: {
        totalGrossSalesRupees: (totalGrossSalesPaise / 100).toFixed(2),
        adminCommissionRupees: (totalAdminCommissionPaise / 100).toFixed(2),
        schoolCommissionRupees: (totalSchoolCommissionPaise / 100).toFixed(2),
        vendorPayoutRupees: (totalVendorPayoutPaise / 100).toFixed(2),
        totalOrdersCount: orderNumbersSet.size,
        totalSchoolsCount: schools.length,
        totalVendorsCount: vendors.length,
        effectiveSplit: {
          adminPercent: effectiveAdminP,
          schoolPercent: effectiveSchoolP,
          vendorPercent: effectiveVendorP,
        },
      },
      channelBreakdown: {
        kits: {
          salesRupees: (channelStats.kits.salesPaise / 100).toFixed(2),
          adminCommissionRupees: (channelStats.kits.adminPaise / 100).toFixed(2),
          schoolCommissionRupees: (channelStats.kits.schoolPaise / 100).toFixed(2),
          vendorPayoutRupees: (channelStats.kits.vendorPaise / 100).toFixed(2),
        },
        retail: {
          salesRupees: (channelStats.retail.salesPaise / 100).toFixed(2),
          adminCommissionRupees: (channelStats.retail.adminPaise / 100).toFixed(2),
          schoolCommissionRupees: (channelStats.retail.schoolPaise / 100).toFixed(2),
          vendorPayoutRupees: (channelStats.retail.vendorPaise / 100).toFixed(2),
        },
      },
      schools: enrichedSchools,
      vendors: enrichedVendors,
      exportMeta: buildExportMeta(query, 'comprehensive_commissions'),
    };
  },
};

module.exports = reportsService;
