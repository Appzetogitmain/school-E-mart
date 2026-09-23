const orderService = require('../../src/modules/orders/services/order.service');
const Order = require('../../src/database/models/Order');
const { createParentUser } = require('./helpers');

/**
 * The admin order list: filters, search, pagination, and the statistics cards
 * that sit above the table.
 *
 * The rule these tests exist to hold is that the cards and the rows must always
 * describe the same set of orders. They are computed from one shared filter
 * builder precisely so a header can never claim a total the table does not
 * contain.
 */
describe('admin order list', () => {
  let user;

  const makeOrder = async (overrides = {}) => {
    const suffix = String(Date.now()) + String(Math.floor(Math.random() * 1000));
    return Order.create({
      orderNumber: `ORD${suffix}`.slice(0, 20),
      userId: user._id,
      audience: 'parent',
      items: [],
      vendorIds: [],
      subtotalPaise: 10000,
      taxPaise: 0,
      discountPaise: 0,
      platformFeePaise: 0,
      deliveryChargePaise: 0,
      handlingChargePaise: 0,
      totalPaise: 10000,
      walletAmountPaise: 0,
      address: { name: 'Asha Mehta', phone: '9876500011', line1: 'A1', city: 'Indore', pinCode: '452001' },
      deliveryType: 'home',
      paymentMethod: 'online',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      placedAt: new Date(),
      ...overrides,
    });
  };

  beforeEach(async () => {
    user = await createParentUser();
    await makeOrder({ orderStatus: 'delivered', paymentStatus: 'paid' });
    await makeOrder({ orderStatus: 'delivered', paymentStatus: 'paid' });
    await makeOrder({ orderStatus: 'cancelled', paymentStatus: 'failed' });
    await makeOrder({ orderStatus: 'placed', paymentStatus: 'pending' });
    await makeOrder({
      orderStatus: 'placed',
      paymentStatus: 'pending',
      address: {
        name: 'Bhavna Rao',
        phone: '9000012345',
        line1: 'B2',
        city: 'Indore',
        pinCode: '452002',
      },
    });
    // Never a real order: must stay out of the admin list and its totals.
    await makeOrder({ orderStatus: 'pending_payment', paymentStatus: 'pending' });
  });

  describe('statistics agree with the rows they sit above', () => {
    const cases = [
      ['no filter', {}],
      ['by order status', { status: 'delivered' }],
      ['by several statuses', { status: 'placed,accepted,packed' }],
      ['by payment status', { paymentStatus: 'pending' }],
      ['by search term', { search: 'Asha' }],
      ['by status and search', { status: 'placed', search: 'Bhavna' }],
    ];

    test.each(cases)('%s', async (_label, query) => {
      const [stats, list] = await Promise.all([
        orderService.getAdminOrderStats(query),
        orderService.listAllOrders(query),
      ]);
      expect(stats.total.count).toBe(list.pagination.total);
    });
  });

  test('an order awaiting payment is not counted as a sale', async () => {
    const stats = await orderService.getAdminOrderStats({});
    const list = await orderService.listAllOrders({});

    // Five real orders were seeded plus one abandoned checkout.
    expect(list.pagination.total).toBe(5);
    expect(stats.total.count).toBe(5);
    expect(list.data.some((o) => o.orderStatus === 'pending_payment')).toBe(false);

    // ...but it is still reachable when asked for by name.
    const explicit = await orderService.listAllOrders({ status: 'pending_payment' });
    expect(explicit.pagination.total).toBe(1);
  });

  test('paginates without losing or repeating orders', async () => {
    const first = await orderService.listAllOrders({ page: 1, limit: 2 });
    const second = await orderService.listAllOrders({ page: 2, limit: 2 });
    const third = await orderService.listAllOrders({ page: 3, limit: 2 });

    expect(first.pagination.total).toBe(5);
    expect(first.pagination.totalPages).toBe(3);
    expect(first.data).toHaveLength(2);
    expect(third.data).toHaveLength(1);

    const ids = [...first.data, ...second.data, ...third.data].map((o) => String(o._id));
    expect(new Set(ids).size).toBe(5);
  });

  test('a page past the end is empty rather than an error', async () => {
    const result = await orderService.listAllOrders({ page: 99, limit: 10 });
    expect(result.data).toHaveLength(0);
    expect(result.pagination.total).toBe(5);
  });

  describe('search', () => {
    test('finds an order by its number', async () => {
      const [order] = (await orderService.listAllOrders({ limit: 1 })).data;
      const result = await orderService.listAllOrders({ search: order.orderNumber });
      expect(result.pagination.total).toBe(1);
    });

    test('finds orders by customer name, case-insensitively', async () => {
      // Searching only the order number meant an operator handed a customer's
      // name — how support requests actually arrive — got nothing back.
      const result = await orderService.listAllOrders({ search: 'bhavna' });
      expect(result.pagination.total).toBe(1);
      expect(result.data[0].address.name).toBe('Bhavna Rao');
    });

    test('finds orders by customer phone', async () => {
      const result = await orderService.listAllOrders({ search: '9000012345' });
      expect(result.pagination.total).toBe(1);
    });

    test('treats regular-expression syntax as literal text', async () => {
      // The term used to be interpolated into a regex unescaped, so '.*'
      // matched every order instead of none, and a pathological pattern could
      // pin the database on backtracking.
      const wildcard = await orderService.listAllOrders({ search: '.*' });
      expect(wildcard.pagination.total).toBe(0);

      const pathological = await orderService.listAllOrders({ search: '(a+)+$' });
      expect(pathological.pagination.total).toBe(0);
    });
  });

  test('money totals separate what was collected from what was merely ordered', async () => {
    const stats = await orderService.getAdminOrderStats({});

    // Two delivered orders are paid; the two placed ones are not.
    expect(stats.paid.count).toBe(2);
    expect(stats.paid.valuePaise).toBe(20000);
    expect(stats.awaitingPayment.count).toBe(2);
    expect(stats.cancelled.count).toBe(1);
    expect(stats.delivered.count).toBe(2);

    // Order value counts every order; collected value counts only paid ones.
    expect(stats.total.valuePaise).toBe(50000);
    expect(stats.paid.valuePaise).toBeLessThan(stats.total.valuePaise);
  });
});
