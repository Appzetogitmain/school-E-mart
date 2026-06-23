const request = require('supertest');
const { createApp } = require('../../src/app');
const { createVendorUser, createAdminUser, authHeaderFor, seedProduct } = require('./helpers');

describe('vendor routes integration', () => {
  const app = createApp();

  test('POST /api/v1/vendor/register is public', async () => {
    const response = await request(app).post('/api/v1/vendor/register').send({
      name: 'Route Vendor',
      storeName: 'Route Store',
      phone: '9876501234',
      email: 'route.vendor@test.com',
      password: 'Vendor@123',
    });
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.refId).toMatch(/^SEM-VEN-/);
  });

  test('GET /api/v1/vendor/orders requires authentication', async () => {
    const response = await request(app).get('/api/v1/vendor/orders');
    expect(response.status).toBe(401);
  });

  test('approved vendor can list products and orders', async () => {
    const { user, profile } = await createVendorUser();
    await seedProduct(profile._id);
    const auth = await authHeaderFor(user);

    const products = await request(app).get('/api/v1/vendor/products').set('Authorization', auth);
    expect(products.status).toBe(200);
    expect(products.body.data.products.length).toBeGreaterThanOrEqual(1);

    const orders = await request(app).get('/api/v1/vendor/orders').set('Authorization', auth);
    expect(orders.status).toBe(200);
  });

  test('pending vendor can access profile but not products', async () => {
    const { user } = await createVendorUser({ approvalStatus: 'pending' });
    const auth = await authHeaderFor(user);

    const profile = await request(app).get('/api/v1/vendor/me/profile').set('Authorization', auth);
    expect(profile.status).toBe(200);

    const products = await request(app).get('/api/v1/vendor/products').set('Authorization', auth);
    expect(products.status).toBe(403);
  });

  test('admin can list and approve vendors', async () => {
    const admin = await createAdminUser();
    const { profile } = await createVendorUser({ approvalStatus: 'pending', storeName: 'Awaiting Approval' });
    const auth = await authHeaderFor(admin);

    const list = await request(app).get('/api/v1/vendor/admin/vendors').set('Authorization', auth);
    expect(list.status).toBe(200);

    const approve = await request(app)
      .post(`/api/v1/vendor/admin/vendors/${profile._id}/approve`)
      .set('Authorization', auth)
      .send({ note: 'Documents verified' });
    expect(approve.status).toBe(200);
    expect(approve.body.data.vendor.approvalStatus).toBe('approved');
  });

  test('vendor cannot access admin verification routes', async () => {
    const { user } = await createVendorUser();
    const auth = await authHeaderFor(user);

    const response = await request(app).get('/api/v1/vendor/admin/vendors').set('Authorization', auth);
    expect(response.status).toBe(403);
  });

  test('GET /api/v1/vendor/analytics/dashboard returns KPIs', async () => {
    const { user, profile } = await createVendorUser();
    await seedProduct(profile._id);
    const auth = await authHeaderFor(user);

    const response = await request(app)
      .get('/api/v1/vendor/analytics/dashboard')
      .set('Authorization', auth);
    expect(response.status).toBe(200);
    expect(response.body.data.dashboard.products).toBeDefined();
  });
});
