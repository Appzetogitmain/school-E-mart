jest.mock('uuid', () => ({ v4: () => require('crypto').randomUUID() }));

const request = require('supertest');
const { createApp } = require('../../src/app');
const { createVendorUser, createAdminUser, authHeaderFor } = require('./helpers');
const vendorValidators = require('../../src/modules/vendor/validators/vendor.validator');
const adminValidators = require('../../src/modules/admin/validators/admin.validator');
const VendorProfile = require('../../src/database/models/VendorProfile');
const User = require('../../src/database/models/User');

/**
 * The vendor-facing and admin-facing routes write the same VendorProfile, so a
 * value that is valid on one must be valid on the other. These previously drifted.
 */
describe('vendor field rules are identical for vendor and admin surfaces', () => {
  const app = createApp();

  const vendorTax = (v) => vendorValidators.taxInfoSchema.validate(v);
  const adminTax = (v) => adminValidators.updateVendorSchema.validate(v);
  const vendorBank = (v) => vendorValidators.bankDetailsSchema.validate(v);
  const adminBank = (v) => adminValidators.updateVendorSchema.validate({ bank: v });

  test.each([
    ['lowercase PAN', { panCard: 'abcde1234f' }],
    ['uppercase PAN', { panCard: 'ABCDE1234F' }],
    ['malformed PAN', { panCard: 'nope' }],
    ['lowercase GSTIN', { gstin: '23abcde1234f1z5' }],
    ['cleared PAN', { panCard: '' }],
  ])('tax: %s is treated the same on both sides', (_label, value) => {
    const v = vendorTax(value);
    const a = adminTax(value);
    expect(Boolean(v.error)).toBe(Boolean(a.error));
    if (!v.error) expect(v.value).toEqual(expect.objectContaining(a.value));
  });

  test.each([
    ['6-digit account (too short)', { accountNumber: '123456' }],
    ['12-digit account', { accountNumber: '123456789012' }],
    ['letters in account', { accountNumber: 'ABCDEFGH' }],
    ['lowercase IFSC', { ifsc: 'hdfc0001234' }],
    ['malformed IFSC', { ifsc: 'nope' }],
  ])('bank: %s is treated the same on both sides', (_label, value) => {
    const v = vendorBank(value);
    const a = adminBank(value);
    expect(Boolean(v.error)).toBe(Boolean(a.error));
  });

  test('both sides normalise PAN and IFSC to uppercase', () => {
    expect(vendorTax({ panCard: 'abcde1234f' }).value.panCard).toBe('ABCDE1234F');
    expect(adminTax({ panCard: 'abcde1234f' }).value.panCard).toBe('ABCDE1234F');
    expect(vendorBank({ ifsc: 'hdfc0001234' }).value.ifsc).toBe('HDFC0001234');
    expect(adminBank({ ifsc: 'hdfc0001234' }).value.bank.ifsc).toBe('HDFC0001234');
  });

  test('every write surface speaks latitude/longitude, never a coordinates array', () => {
    const geo = { latitude: 22.7, longitude: 75.8 };
    expect(vendorValidators.registerSchema.validate({
      name: 'A B', storeName: 'S T', phone: '9876500011',
      email: 'a@b.com', password: 'Vendor@123', ...geo,
    }).error).toBeUndefined();
    expect(vendorValidators.updateProfileSchema.validate(geo).error).toBeUndefined();
    expect(vendorValidators.addressSchema.validate(geo).error).toBeUndefined();
    expect(adminValidators.updateVendorSchema.validate(geo).error).toBeUndefined();

    // the old array form is gone from every surface
    const coords = { coordinates: [75.8, 22.7] };
    expect(vendorValidators.updateProfileSchema.validate(coords).error).toBeDefined();
    expect(adminValidators.updateVendorSchema.validate(coords).error).toBeDefined();
  });

  test('a self-registering vendor cannot choose their own commission', async () => {
    const res = await request(app).post('/api/v1/vendor/register').send({
      name: 'Greedy Vendor',
      storeName: 'Greedy Store',
      phone: '9876522211',
      email: 'greedy@test.com',
      password: 'Vendor@123',
      commissionPercent: 0, // attempt to zero out the marketplace's cut
    });

    // The field is not on the register schema, and validation runs with
    // stripUnknown, so the attempt is discarded rather than rejected.
    expect(res.status).toBe(201);
    const profile = await VendorProfile.findOne({ storeName: 'Greedy Store' }).lean();
    expect(Number(profile.commissionPercent.toString())).toBe(10);
    expect(Number(profile.commissionPercent.toString())).not.toBe(0);
  });

  test('registering without a commission uses the platform default', async () => {
    await request(app).post('/api/v1/vendor/register').send({
      name: 'Normal Vendor',
      storeName: 'Normal Store',
      phone: '9876522212',
      email: 'normal@test.com',
      password: 'Vendor@123',
    });
    const profile = await VendorProfile.findOne({ storeName: 'Normal Store' }).lean();
    expect(Number(profile.commissionPercent.toString())).toBe(10);
  });

  test('signup coordinates are stored in GeoJSON [lng, lat] order', async () => {
    await request(app).post('/api/v1/vendor/register').send({
      name: 'Geo Vendor',
      storeName: 'Geo Store',
      phone: '9876522213',
      email: 'geo@test.com',
      password: 'Vendor@123',
      latitude: 22.7196,
      longitude: 75.8577,
    });
    const profile = await VendorProfile.findOne({ storeName: 'Geo Store' }).lean();
    expect(profile.location.coordinates[0]).toBeCloseTo(75.8577);
    expect(profile.location.coordinates[1]).toBeCloseTo(22.7196);
  });
});

describe('email/phone cannot be taken from another account', () => {
  const app = createApp();

  test('vendor self-update rejects an email already in use', async () => {
    const a = await createVendorUser({ storeName: 'Store A' });
    const b = await createVendorUser({ storeName: 'Store B' });

    const res = await request(app)
      .put('/api/v1/vendor/me/profile')
      .set('Authorization', await authHeaderFor(b.user))
      .send({ email: a.user.email });

    expect(res.status).toBe(409);
    expect(await User.countDocuments({ email: a.user.email })).toBe(1);
  });

  test('vendor self-update rejects a phone already in use', async () => {
    const a = await createVendorUser({ storeName: 'Store A' });
    const b = await createVendorUser({ storeName: 'Store B' });

    const res = await request(app)
      .put('/api/v1/vendor/me/profile')
      .set('Authorization', await authHeaderFor(b.user))
      .send({ phone: a.user.phone });

    expect(res.status).toBe(409);
    expect(await User.countDocuments({ phone: a.user.phone })).toBe(1);
  });

  test('admin edit rejects an email already in use', async () => {
    const a = await createVendorUser({ storeName: 'Store A' });
    const b = await createVendorUser({ storeName: 'Store B' });
    const admin = await createAdminUser();

    const res = await request(app)
      .patch(`/api/v1/admin/vendors/${b.profile._id}`)
      .set('Authorization', await authHeaderFor(admin))
      .send({ email: a.user.email });

    expect(res.status).toBe(409);
    expect(await User.countDocuments({ email: a.user.email })).toBe(1);
  });

  test('keeping your own email is still allowed', async () => {
    const v = await createVendorUser();
    const res = await request(app)
      .put('/api/v1/vendor/me/profile')
      .set('Authorization', await authHeaderFor(v.user))
      .send({ email: v.user.email, name: 'Renamed Owner' });

    expect(res.status).toBe(200);
    expect((await User.findById(v.user._id).lean()).name).toBe('Renamed Owner');
  });
});
