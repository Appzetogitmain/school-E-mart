const orderService = require('../../src/modules/orders/services/order.service');
const cancellationService = require('../../src/modules/orders/services/cancellation.service');
const Product = require('../../src/database/models/Product');
const Cart = require('../../src/database/models/Cart');
const { createParentUser, seedCartForUser, defaultAddress, createSchoolUser } = require('./helpers');
const { canTransition, canCustomerCancel } = require('../../src/modules/orders/utils/statusMachine');

describe('order service', () => {
  test('creates order from cart and deducts inventory', async () => {
    const user = await createParentUser();
    const { product } = await seedCartForUser(user._id);
    const stockBefore = (await Product.findById(product._id)).stock;

    const order = await orderService.createOrder(
      user._id,
      'parent',
      { address: defaultAddress, deliveryType: 'home', paymentMethod: 'cod' },
      { userId: user._id, role: 'parent' }
    );

    expect(order.orderNumber).toMatch(/^ORD/);
    expect(order.items).toHaveLength(1);
    expect(order.vendorIds).toHaveLength(1);

    const stockAfter = (await Product.findById(product._id)).stock;
    expect(stockAfter).toBe(stockBefore - 1);

    const cart = await Cart.findOne({ userId: user._id, audience: 'parent' });
    expect(cart.items).toHaveLength(0);
  });

  test('cancels order and restores inventory', async () => {
    const user = await createParentUser();
    const { product } = await seedCartForUser(user._id);
    const order = await orderService.createOrder(user._id, 'parent', {
      address: defaultAddress,
      deliveryType: 'home',
      paymentMethod: 'cod',
    });

    const stockAfterOrder = (await Product.findById(product._id)).stock;
    const cancelled = await cancellationService.cancelOrder(
      order._id,
      { reason: 'Changed mind', cancelledBy: user._id },
      { role: 'customer' }
    );

    expect(cancelled.orderStatus).toBe('cancelled');
    const stockAfterCancel = (await Product.findById(product._id)).stock;
    expect(stockAfterCancel).toBe(stockAfterOrder + 1);
  });

  test('enforces valid status transitions', () => {
    expect(canTransition('placed', 'accepted')).toBe(true);
    expect(canTransition('placed', 'delivered')).toBe(false);
    expect(canCustomerCancel('placed')).toBe(true);
    expect(canCustomerCancel('processed')).toBe(false);
  });

  test('blocks invalid status transition', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);
    const order = await orderService.createOrder(user._id, 'parent', {
      address: defaultAddress,
      deliveryType: 'home',
      paymentMethod: 'cod',
    });

    await expect(
      orderService.transitionStatus(order._id, { status: 'delivered' }, { userId: user._id })
    ).rejects.toMatchObject({ code: 'INVALID_ORDER_TRANSITION' });
  });

  test('lists school pickup orders for a school', async () => {
    const { school } = await createSchoolUser();
    const parent = await createParentUser();
    await seedCartForUser(parent._id);
    const pickupAddress = { ...defaultAddress, line1: 'School Gate' };

    await orderService.createOrder(parent._id, 'parent', {
      address: pickupAddress,
      deliveryType: 'school',
      schoolIdForPickup: school._id,
      paymentMethod: 'cod',
    });

    const result = await orderService.listSchoolPickupOrders(school._id, { page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(String(result.data[0].schoolIdForPickup)).toBe(String(school._id));
  });

  test('filters admin order list by vendor and school', async () => {
    const parent = await createParentUser();
    const { vendorId, product } = await seedCartForUser(parent._id);
    const { school } = await createSchoolUser();

    await orderService.createOrder(parent._id, 'parent', {
      address: defaultAddress,
      deliveryType: 'school',
      schoolIdForPickup: school._id,
      paymentMethod: 'cod',
    });

    const byVendor = await orderService.listAllOrders({ vendorId, page: 1, limit: 10 });
    expect(byVendor.data).toHaveLength(1);
    expect(byVendor.data[0].vendorIds.map(String)).toContain(String(vendorId));

    const bySchool = await orderService.listAllOrders({ schoolId: school._id, page: 1, limit: 10 });
    expect(bySchool.data).toHaveLength(1);
    expect(String(bySchool.data[0].schoolIdForPickup)).toBe(String(school._id));

    void product;
  });

  test('updates payment status after confirmation', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);
    const order = await orderService.createOrder(user._id, 'parent', {
      address: defaultAddress,
      deliveryType: 'home',
      paymentMethod: 'online',
    });

    expect(order.paymentStatus).toBe('pending');
    const updated = await orderService.updatePaymentStatus(order._id, 'paid');
    expect(updated.paymentStatus).toBe('paid');
  });
});
