const vendorOrderService = require('../../src/modules/vendor/services/order.service');
const { createVendorUser, seedProduct, seedOrder } = require('./helpers');
const User = require('../../src/database/models/User');

describe('vendor order service', () => {
  let vendorId;
  let userId;
  let orderId;

  beforeEach(async () => {
    const { user, profile } = await createVendorUser();
    vendorId = profile._id;
    const customer = await User.create({
      refId: 'SEM-P-TEST01',
      role: 'parent',
      status: 'active',
      name: 'Customer',
      phone: '9123456789',
    });
    userId = customer._id;
    const product = await seedProduct(vendorId);
    const order = await seedOrder(vendorId, userId, product);
    orderId = order._id;
  });

  test('lists vendor orders with pagination', async () => {
    const { data, pagination } = await vendorOrderService.listOrders(vendorId, { page: 1, limit: 10 });
    expect(data).toHaveLength(1);
    expect(pagination.total).toBe(1);
  });

  test('accepts and processes order workflow', async () => {
    const actor = { userId, role: 'vendor' };
    let order = await vendorOrderService.acceptOrder(vendorId, orderId, actor, 'Accepted');
    expect(order.orderStatus).toBe('accepted');

    order = await vendorOrderService.processOrder(vendorId, orderId, actor);
    expect(order.orderStatus).toBe('processed');

    order = await vendorOrderService.markReadyForDispatch(vendorId, orderId, actor);
    expect(order.orderStatus).toBe('packed');
  });

  test('rejects order from placed status and restores inventory', async () => {
    const Product = require('../../src/database/models/Product');
    const product = await Product.findById((await vendorOrderService.getOrder(vendorId, orderId)).items[0].productId);
    const stockBefore = product.stock;

    const order = await vendorOrderService.rejectOrder(vendorId, orderId, { userId, role: 'vendor' }, 'Out of stock');
    expect(order.orderStatus).toBe('cancelled');

    const stockAfter = (await Product.findById(product._id)).stock;
    expect(stockAfter).toBe(stockBefore + order.items[0].quantity);
  });

  test('blocks invalid status transition', async () => {
    await expect(
      vendorOrderService.updateOrderStatus(vendorId, orderId, { status: 'delivered' }, { userId, role: 'vendor' })
    ).rejects.toMatchObject({ code: 'INVALID_ORDER_TRANSITION' });
  });

  test('denies access to another vendor order', async () => {
    const { profile: otherVendor } = await createVendorUser({ storeName: 'Other Store' });
    await expect(vendorOrderService.getOrder(otherVendor._id, orderId)).rejects.toMatchObject({
      code: 'ORDER_NOT_FOUND',
    });
  });
});
