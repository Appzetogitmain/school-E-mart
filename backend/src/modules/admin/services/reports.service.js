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
};

module.exports = reportsService;
