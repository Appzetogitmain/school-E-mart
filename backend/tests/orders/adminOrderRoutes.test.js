const request = require('supertest');
const { createApp } = require('../../src/app');
const { createParentUser, authHeaderFor } = require('./helpers');
const User = require('../../src/database/models/User');
const { ROLES } = require('../../src/constants/roles');

/**
 * Route resolution for the admin order screens.
 *
 * Express matches routes in registration order, so a literal path registered
 * after '/:orderId' is never reached — the wildcard claims it first and the
 * handler tries to look up an order whose id is the literal segment. Both
 * '/orders/stats' and '/orders/payments/mismatches' were registered after it,
 * so the statistics cards and the reconciliation panel silently received 404s
 * and rendered nothing at all.
 *
 * These tests pin the resolution itself, which unit-testing the services could
 * never have caught.
 */
describe('admin order routes resolve to their own handlers', () => {
  const app = createApp();

  const createAdmin = async () => {
    const user = await createParentUser();
    await User.updateOne(
      { _id: user._id },
      { $set: { role: ROLES.SUPER_ADMIN, roleScopes: ['*'] } }
    );
    const fresh = await User.findById(user._id).lean();
    return { user: fresh, auth: await authHeaderFor(fresh, ROLES.SUPER_ADMIN) };
  };

  test('GET /orders/stats returns statistics, not an order lookup', async () => {
    const { auth } = await createAdmin();
    const response = await request(app)
      .get('/api/v1/orders/stats')
      .set('Authorization', auth);

    expect(response.status).toBe(200);
    // The shape proves it reached getOrderStats rather than getOrder.
    expect(response.body.data.stats).toBeDefined();
    expect(response.body.data.stats.total).toHaveProperty('count');
    expect(response.body.data.stats).toHaveProperty('paid');
    expect(response.body.data.stats).toHaveProperty('awaitingPayment');
  });

  test('GET /orders/stats accepts the same filters as the order list', async () => {
    const { auth } = await createAdmin();
    const response = await request(app)
      .get('/api/v1/orders/stats')
      .query({ status: 'delivered', paymentStatus: 'paid', search: 'ORD' })
      .set('Authorization', auth);

    expect(response.status).toBe(200);
    expect(response.body.data.stats.total).toHaveProperty('count');
  });

  test('GET /orders/payments/mismatches reaches the reconciliation handler', async () => {
    const { auth } = await createAdmin();
    const response = await request(app)
      .get('/api/v1/orders/payments/mismatches')
      .set('Authorization', auth);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data.mismatches)).toBe(true);
  });

  test('a genuine order id still resolves to the order handler', async () => {
    const { auth } = await createAdmin();
    const response = await request(app)
      .get('/api/v1/orders/ORD-DOES-NOT-EXIST')
      .set('Authorization', auth);

    // 404 from the order lookup itself, which is the correct outcome here —
    // what matters is that the wildcard route is still reachable.
    expect(response.status).toBe(404);
  });
});
