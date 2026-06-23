const { NotFoundError, BadRequestError } = require('../../../common/errors');
const productService = require('../../marketplace/services/product.service');
const vendorAccessPolicy = require('../policies/vendorAccess.policy');
const inventoryHistoryRepository = require('../repositories/inventoryHistory.repository');
const productRepository = require('../../marketplace/repositories/product.repository');
const { buildPaginationMeta } = require('../../../common/pagination');

const inventoryService = {
  async getInventory(vendorId, productId) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);
    return {
      productId: product._id,
      inventory: productService.getInventoryStatus(product),
      lowStockThreshold: product.lowStockThreshold,
    };
  },

  async updateStock(vendorId, productId, { stock, lowStockThreshold }, actor = {}) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);

    const before = { stock: product.stock, lowStockThreshold: product.lowStockThreshold };
    const result = await productService.updateInventory(productId, { stock, lowStockThreshold });

    await inventoryHistoryRepository.logAdjustment({
      actorUserId: actor.userId,
      actorRole: actor.role,
      productId: product._id,
      before,
      after: { stock: result.product.stock, lowStockThreshold: result.product.lowStockThreshold },
      note: 'stock_update',
    });

    return result;
  },

  async adjustInventory(vendorId, productId, { adjustment, reason }, actor = {}) {
    if (!Number.isInteger(adjustment) || adjustment === 0) {
      throw new BadRequestError('Adjustment must be a non-zero integer', null, 'INVALID_ADJUSTMENT');
    }

    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);

    const newStock = Math.max(0, (product.stock ?? 0) + adjustment);
    const before = { stock: product.stock };
    const result = await productService.updateInventory(productId, { stock: newStock });

    await inventoryHistoryRepository.logAdjustment({
      actorUserId: actor.userId,
      actorRole: actor.role,
      productId: product._id,
      before,
      after: { stock: result.product.stock, adjustment, reason },
      note: reason || 'inventory_adjustment',
    });

    return result;
  },

  async listLowStock(vendorId, query) {
    const filter = {
      vendorId,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    };
    const { data, pagination } = await productRepository.paginateProducts(filter, query);
    return {
      data: data.map((p) => ({
        ...p,
        inventory: productService.getInventoryStatus(p),
      })),
      pagination,
    };
  },

  async getHistory(vendorId, productId, query) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);

    const page = query.page || 1;
    const limit = query.limit || 20;
    const { data, total } = await inventoryHistoryRepository.findByProduct(productId, { page, limit });

    return {
      data,
      pagination: buildPaginationMeta({ total, page, limit }),
    };
  },

  async checkAvailability(vendorId, productId) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);
    const inventory = productService.getInventoryStatus(product);
    return {
      productId: product._id,
      available: inventory.stockStatus !== 'out_of_stock',
      ...inventory,
    };
  },
};

module.exports = inventoryService;
