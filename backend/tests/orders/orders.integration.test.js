const request = require('supertest');
const { createApp } = require('../../src/app');
const { createParentUser, authHeaderFor, seedCartForUser, defaultAddress } = require('./helpers');

describe('orders routes integration', () => {
  const app = createApp();

  test('POST /api/v1/orders requires authentication', async () => {
    const response = await request(app).post('/api/v1/orders').send({ address: defaultAddress });
    expect(response.status).toBe(401);
  });

  test('GET /api/v1/orders/track/:orderNumber is public', async () => {
    const response = await request(app).get('/api/v1/orders/track/ORD-NOT-FOUND');
    expect(response.status).toBe(404);
  });

  test('checkout summary and order placement flow', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);
    const auth = await authHeaderFor(user);

    const summary = await request(app)
      .post('/api/v1/orders/checkout/summary')
      .set('Authorization', auth)
      .send({ address: defaultAddress, deliveryType: 'home', paymentMethod: 'cod' });
    expect(summary.status).toBe(200);
    expect(summary.body.data.summary.itemCount).toBe(1);

    const placed = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', auth)
      .send({ address: defaultAddress, deliveryType: 'home', paymentMethod: 'cod' });
    expect(placed.status).toBe(201);
    expect(placed.body.data.order.orderNumber).toMatch(/^ORD/);

    const list = await request(app).get('/api/v1/orders').set('Authorization', auth);
    expect(list.status).toBe(200);
    expect(list.body.data.orders.length).toBeGreaterThanOrEqual(1);
  });

  test('customer can cancel placed order', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);
    const auth = await authHeaderFor(user);

    const placed = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', auth)
      .send({ address: defaultAddress, deliveryType: 'home', paymentMethod: 'cod' });

    const cancelled = await request(app)
      .post(`/api/v1/orders/${placed.body.data.order._id}/cancel`)
      .set('Authorization', auth)
      .send({ reason: 'Ordered by mistake' });
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.order.orderStatus).toBe('cancelled');
  });
});
