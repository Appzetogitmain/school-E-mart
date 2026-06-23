const request = require('supertest');
const { createApp } = require('../../src/app');
const {
  createAdminUser,
  createVendorUser,
  authHeaderFor,
  seedSchool,
} = require('./helpers');
const User = require('../../src/database/models/User');
const { generateUserRefId } = require('../../src/modules/school/utils/refId');

describe('admin routes integration', () => {
  const app = createApp();

  test('admin routes require authentication', async () => {
    const response = await request(app).get('/api/v1/admin/dashboard');
    expect(response.status).toBe(401);
  });

  test('non-admin cannot access admin dashboard', async () => {
    const { user } = await createVendorUser();
    const auth = await authHeaderFor(user);
    const response = await request(app).get('/api/v1/admin/dashboard').set('Authorization', auth);
    expect(response.status).toBe(403);
  });

  test('admin can fetch dashboard', async () => {
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    const response = await request(app).get('/api/v1/admin/dashboard').set('Authorization', auth);
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.overview).toBeDefined();
    expect(response.body.data.systemHealth.database.healthy).toBe(true);
  });

  test('admin can list and manage users', async () => {
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    const target = await User.create({
      refId: generateUserRefId('P'),
      role: 'parent',
      status: 'active',
      name: 'Suspend Target',
      phone: `7${String(Date.now()).slice(-9)}`,
    });

    const list = await request(app).get('/api/v1/admin/users').set('Authorization', auth);
    expect(list.status).toBe(200);
    expect(list.body.data.users.length).toBeGreaterThanOrEqual(1);

    const suspended = await request(app)
      .patch(`/api/v1/admin/users/${target._id}/suspend`)
      .set('Authorization', auth)
      .send({ reason: 'Policy violation' });
    expect(suspended.status).toBe(200);
    expect(suspended.body.data.user.status).toBe('suspended');

    const activated = await request(app)
      .patch(`/api/v1/admin/users/${target._id}/activate`)
      .set('Authorization', auth);
    expect(activated.status).toBe(200);
    expect(activated.body.data.user.status).toBe('active');
  });

  test('admin can approve pending vendor via admin API', async () => {
    const admin = await createAdminUser();
    const { profile } = await createVendorUser({ approvalStatus: 'pending' });
    const auth = await authHeaderFor(admin);

    const pending = await request(app).get('/api/v1/admin/vendors/pending').set('Authorization', auth);
    expect(pending.status).toBe(200);

    const approve = await request(app)
      .post(`/api/v1/admin/vendors/${profile._id}/approve`)
      .set('Authorization', auth)
      .send({ note: 'Verified' });
    expect(approve.status).toBe(200);
    expect(approve.body.data.vendor.approvalStatus).toBe('approved');
  });

  test('admin can approve pending school', async () => {
    const admin = await createAdminUser();
    const school = await seedSchool({ partnerStatus: 'prospect' });
    const auth = await authHeaderFor(admin);

    const approve = await request(app)
      .post(`/api/v1/admin/schools/${school._id}/approve`)
      .set('Authorization', auth)
      .send({ note: 'Documents OK' });
    expect(approve.status).toBe(200);
    expect(approve.body.data.school.partnerStatus).toBe('active');
  });

  test('admin can manage CMS pages', async () => {
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    const created = await request(app)
      .post('/api/v1/admin/cms/pages')
      .set('Authorization', auth)
      .send({
        title: 'Test Page',
        slug: `test-page-${Date.now()}`,
        content: '<p>Hello</p>',
      });
    expect(created.status).toBe(201);

    const published = await request(app)
      .post(`/api/v1/admin/cms/pages/${created.body.data.page._id}/publish`)
      .set('Authorization', auth);
    expect(published.status).toBe(200);
    expect(published.body.data.page.status).toBe('published');
  });

  test('admin can read and update settings', async () => {
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    const getAll = await request(app).get('/api/v1/admin/settings').set('Authorization', auth);
    expect(getAll.status).toBe(200);
    expect(getAll.body.data.settings.platform).toBeDefined();

    const update = await request(app)
      .put('/api/v1/admin/settings/general')
      .set('Authorization', auth)
      .send({ platformName: 'School E-Mart Admin' });
    expect(update.status).toBe(200);
    expect(update.body.data.section.platformName).toBe('School E-Mart Admin');
  });

  test('admin analytics endpoints return data', async () => {
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    const users = await request(app).get('/api/v1/admin/analytics/users').set('Authorization', auth);
    expect(users.status).toBe(200);
    expect(users.body.data.analytics).toHaveProperty('totalUsers');

    const orders = await request(app).get('/api/v1/admin/analytics/orders').set('Authorization', auth);
    expect(orders.status).toBe(200);
    expect(orders.body.data.analytics).toHaveProperty('ordersPerDay');
  });

  test('admin reports include export metadata', async () => {
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    const report = await request(app).get('/api/v1/admin/reports/users').set('Authorization', auth);
    expect(report.status).toBe(200);
    expect(report.body.data.exportMeta.reportType).toBe('users');
  });
});
