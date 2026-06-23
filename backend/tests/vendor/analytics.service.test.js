const analyticsService = require('../../src/modules/vendor/services/analytics.service');
const verificationService = require('../../src/modules/vendor/services/verification.service');
const vendorReturnService = require('../../src/modules/vendor/services/return.service');
const inventoryService = require('../../src/modules/vendor/services/inventory.service');
const { createVendorUser, seedProduct, seedOrder, seedReturn } = require('./helpers');
const User = require('../../src/database/models/User');
const productService = require('../../src/modules/marketplace/services/product.service');

describe('vendor analytics and verification', () => {
  let vendorId;
  let userId;
  let actor;

  beforeEach(async () => {
    const { user, profile } = await createVendorUser();
    vendorId = profile._id;
    userId = user._id;
    actor = { userId, role: 'admin' };
    const customer = await User.create({
      refId: 'SEM-P-ANLYT1',
      role: 'parent',
      status: 'active',
      name: 'Customer',
      phone: '9123456781',
    });
    const product = await seedProduct(vendorId);
    const order = await seedOrder(vendorId, customer._id, product);
    await seedReturn(vendorId, customer._id, order, product);
    await productService.updateInventory(product._id, { stock: 2, lowStockThreshold: 5 });
  });

  test('returns dashboard analytics', async () => {
    const dashboard = await analyticsService.getDashboard(vendorId);
    expect(dashboard.products.totalProducts).toBe(1);
    expect(dashboard.orders.ordersReceived).toBe(1);
    expect(dashboard.returns.totalReturns).toBe(1);
    expect(dashboard.lowStockProducts).toBe(1);
  });

  test('approves and suspends vendor', async () => {
    const { profile } = await createVendorUser({ approvalStatus: 'pending', storeName: 'Pending Store' });
    const approved = await verificationService.approveVendor(profile._id, actor);
    expect(approved.approvalStatus).toBe('approved');

    const suspended = await verificationService.suspendVendor(profile._id, actor, 'Policy violation');
    expect(suspended.approvalStatus).toBe('suspended');
  });

  test('manages return workflow', async () => {
    const { data } = await vendorReturnService.listReturns(vendorId, {});
    const returnId = data[0]._id;

    const approved = await vendorReturnService.approveReturn(vendorId, returnId, { userId, role: 'vendor' });
    expect(approved.status).toBe('approved');
  });

  test('lists low stock products', async () => {
    const { data } = await inventoryService.listLowStock(vendorId, {});
    expect(data.length).toBeGreaterThanOrEqual(1);
  });
});
