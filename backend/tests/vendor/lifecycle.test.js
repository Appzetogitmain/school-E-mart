// jest.setup mocks uuid.v4 to a constant, which makes every auth session share a
// jti and collide. This suite logs in repeatedly, so use real uuids here.
jest.mock('uuid', () => ({ v4: () => require('crypto').randomUUID() }));

const request = require('supertest');
const { createApp } = require('../../src/app');
const { createAdminUser, authHeaderFor } = require('./helpers');
const VendorProfile = require('../../src/database/models/VendorProfile');

const REG = {
  name: 'Self Serve Vendor',
  storeName: 'Self Serve Store',
  phone: '9876500011',
  email: 'self.serve@test.com',
  password: 'Vendor@123',
};

describe('vendor lifecycle: self-registration -> admin approval -> login', () => {
  const app = createApp();

  const login = () =>
    request(app).post('/api/v1/auth/vendor/login').send({
      email: REG.email,
      password: REG.password,
    });

  const registerVendor = async () => {
    const res = await request(app).post('/api/v1/vendor/register').send(REG);
    expect(res.status).toBe(201);
    return VendorProfile.findOne({ storeName: REG.storeName }).lean();
  };

  test('a vendor can register themselves and lands in pending', async () => {
    const res = await request(app).post('/api/v1/vendor/register').send(REG);

    expect(res.status).toBe(201);
    expect(res.body.data.profile.status).toBe('pending');
    expect(res.body.data.user.refId).toMatch(/^SEM-VEN-/);

    const profile = await VendorProfile.findOne({ storeName: REG.storeName }).lean();
    expect(profile.approvalStatus).toBe('pending');
  });

  test('duplicate email is rejected', async () => {
    await registerVendor();
    const dupe = await request(app)
      .post('/api/v1/vendor/register')
      .send({ ...REG, storeName: 'Other Store', phone: '9876500099' });
    expect(dupe.status).toBe(409);
  });

  test('a pending vendor can log in (to see onboarding) but is not approved yet', async () => {
    await registerVendor();
    const res = await login();
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  test('admin approval flips the vendor to approved and login still works', async () => {
    const profile = await registerVendor();
    const admin = await createAdminUser();

    const approve = await request(app)
      .post(`/api/v1/admin/vendors/${profile._id}/approve`)
      .set('Authorization', await authHeaderFor(admin))
      .send({});
    expect(approve.status).toBe(200);

    const after = await VendorProfile.findById(profile._id).lean();
    expect(after.approvalStatus).toBe('approved');
    expect(after.verifiedBadge).toBe(true);

    const res = await login();
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  test('approving twice is rejected rather than silently repeated', async () => {
    const profile = await registerVendor();
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    await request(app)
      .post(`/api/v1/admin/vendors/${profile._id}/approve`)
      .set('Authorization', auth)
      .send({});
    const second = await request(app)
      .post(`/api/v1/admin/vendors/${profile._id}/approve`)
      .set('Authorization', auth)
      .send({});
    expect(second.status).toBe(400);
  });

  test('a suspended vendor cannot log in', async () => {
    const profile = await registerVendor();
    const admin = await createAdminUser();

    await request(app)
      .post(`/api/v1/admin/vendors/${profile._id}/suspend`)
      .set('Authorization', await authHeaderFor(admin))
      .send({ reason: 'probe' });

    const res = await login();
    expect(res.status).toBe(403);
  });

  test('a rejected vendor cannot log in', async () => {
    const profile = await registerVendor();
    const admin = await createAdminUser();

    await request(app)
      .post(`/api/v1/admin/vendors/${profile._id}/reject`)
      .set('Authorization', await authHeaderFor(admin))
      .send({ reason: 'probe' });

    const res = await login();
    expect(res.status).toBe(403);
  });

  test('reactivating a suspended vendor restores login', async () => {
    const profile = await registerVendor();
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    await request(app)
      .post(`/api/v1/admin/vendors/${profile._id}/suspend`)
      .set('Authorization', auth)
      .send({ reason: 'probe' });
    expect((await login()).status).toBe(403);

    await request(app)
      .post(`/api/v1/admin/vendors/${profile._id}/reactivate`)
      .set('Authorization', auth)
      .send({});

    const res = await login();
    expect(res.status).toBe(200);
  });
});

describe('registration robustness', () => {
  const app = createApp();

  test('a partially filled address is completed with defaults rather than rejected', async () => {
    const res = await request(app)
      .post('/api/v1/vendor/register')
      .send({ ...REG, address: { city: 'Indore' } });

    expect(res.status).toBe(201);
    const profile = await VendorProfile.findOne({ storeName: REG.storeName }).lean();
    expect(profile.address.city).toBe('Indore');
    // required fields the caller omitted are filled in, not left blank
    expect(profile.address.country).toBe('India');
    expect(profile.address.line1).toBeTruthy();
    expect(profile.address.state).toBeTruthy();
    expect(profile.address.pinCode).toBeTruthy();
  });

  test('a failed profile creation does not orphan the user, so the email stays reusable', async () => {
    const User = require('../../src/database/models/User');

    // Force the profile write to fail *after* the user row is written. Bad input
    // cannot exercise this path: Joi rejects it before the service ever runs.
    const createSpy = jest
      .spyOn(VendorProfile, 'create')
      .mockRejectedValueOnce(new Error('simulated profile write failure'));

    const bad = await request(app).post('/api/v1/vendor/register').send(REG);
    expect(bad.status).toBeGreaterThanOrEqual(400);
    expect(createSpy).toHaveBeenCalled();
    createSpy.mockRestore();

    // the half-created user must be rolled back
    expect(await User.findOne({ email: REG.email }).lean()).toBeNull();

    // ...so a retry succeeds instead of hitting EMAIL_EXISTS forever
    const retry = await request(app).post('/api/v1/vendor/register').send(REG);
    expect(retry.status).toBe(201);
  });
});
