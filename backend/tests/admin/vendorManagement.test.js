// jest.setup mocks uuid.v4 to a constant, which makes every auth session share a
// jti and collide. These tests mint several sessions, so use real uuids here.
jest.mock('uuid', () => ({ v4: () => require('crypto').randomUUID() }));

const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../../src/app');
const { createAdminUser, createVendorUser, authHeaderFor } = require('../vendor/helpers');
const VendorProfile = require('../../src/database/models/VendorProfile');
const User = require('../../src/database/models/User');
const { encryptAccountNumber } = require('../../src/modules/vendor/utils/bank');

const NEW_VENDOR = {
  name: 'Admin Made Vendor',
  storeName: 'Admin Made Store',
  phone: '9876500022',
  email: 'admin.made@test.com',
  password: 'Vendor@123',
  commissionPercent: 12.5,
  address: {
    line1: '1 Admin Road',
    city: 'Indore',
    state: 'MP',
    country: 'India',
    pinCode: '452001',
  },
};

describe('admin vendor management', () => {
  const app = createApp();
  let adminUser;

  // uuid.v4 is mocked to a constant in jest.setup, so mint one session per test.
  const asAdmin = () => authHeaderFor(adminUser);

  beforeEach(async () => {
    adminUser = await createAdminUser();
  });

  describe('POST /admin/vendors', () => {
    test('creates a vendor and auto-approves it', async () => {
      const res = await request(app)
        .post('/api/v1/admin/vendors')
        .set('Authorization', await asAdmin())
        .send(NEW_VENDOR);

      expect(res.status).toBe(201);
      const { vendor } = res.body.data;
      expect(vendor.storeName).toBe('Admin Made Store');
      expect(vendor.approvalStatus).toBe('approved');
      expect(vendor.status).toBe('approved');
      // commissionPercent must be a plain number, not Decimal128 JSON
      expect(vendor.commissionPercent).toBe(12.5);
      expect(vendor.user.refId).toMatch(/^SEM-VEN-/);
    });

    test('the created vendor can log in immediately', async () => {
      await request(app)
        .post('/api/v1/admin/vendors')
        .set('Authorization', await asAdmin())
        .send(NEW_VENDOR);

      const login = await request(app).post('/api/v1/auth/vendor/login').send({
        email: NEW_VENDOR.email,
        password: NEW_VENDOR.password,
      });
      expect(login.status).toBe(200);
      expect(login.body.data.accessToken).toBeTruthy();
    });

    test('rejects a duplicate email', async () => {
      await request(app)
        .post('/api/v1/admin/vendors')
        .set('Authorization', await asAdmin())
        .send(NEW_VENDOR);

      const dupe = await request(app)
        .post('/api/v1/admin/vendors')
        .set('Authorization', await asAdmin())
        .send({ ...NEW_VENDOR, storeName: 'Another Store', phone: '9876500033' });
      expect(dupe.status).toBe(409);
    });

    test('requires admin auth', async () => {
      const res = await request(app).post('/api/v1/admin/vendors').send(NEW_VENDOR);
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /admin/vendors/:id', () => {
    test('updates profile + user fields together', async () => {
      const { profile } = await createVendorUser({ storeName: 'Old Store' });

      const res = await request(app)
        .patch(`/api/v1/admin/vendors/${profile._id}`)
        .set('Authorization', await asAdmin())
        .send({
          storeName: 'New Store',
          name: 'New Owner Name',
          phone: '9876500044',
          commissionPercent: 20,
          serviceRadiusKm: 25,
          address: { city: 'Bhopal' },
        });

      expect(res.status).toBe(200);
      const { vendor } = res.body.data;
      expect(vendor.storeName).toBe('New Store');
      expect(vendor.commissionPercent).toBe(20);
      expect(vendor.serviceRadiusKm).toBe(25);
      expect(vendor.address.city).toBe('Bhopal');
      // untouched address fields survive the merge
      expect(vendor.address.pinCode).toBe('110001');
      expect(vendor.user.name).toBe('New Owner Name');
      expect(vendor.user.phone).toBe('9876500044');
    });

    test('regenerates the slug when the store is renamed', async () => {
      const { profile } = await createVendorUser({ storeName: 'Slug Store' });
      const before = profile.storeSlug;

      await request(app)
        .patch(`/api/v1/admin/vendors/${profile._id}`)
        .set('Authorization', await asAdmin())
        .send({ storeName: 'Totally Different Name' });

      const after = await VendorProfile.findById(profile._id).lean();
      expect(after.storeSlug).not.toBe(before);
    });

    test('stores the bank account number as a one-way hash, never plaintext', async () => {
      const { profile } = await createVendorUser();

      await request(app)
        .patch(`/api/v1/admin/vendors/${profile._id}`)
        .set('Authorization', await asAdmin())
        .send({
          panCard: 'ABCDE1234F',
          gstin: '23ABCDE1234F1Z5',
          bank: {
            accountName: 'Store Owner',
            bankName: 'HDFC',
            branch: 'Indore',
            accountNumber: '123456789012',
            ifsc: 'HDFC0001234',
          },
        });

      const after = await VendorProfile.findById(profile._id).lean();
      expect(after.panCard).toBe('ABCDE1234F');
      expect(after.gstin).toBe('23ABCDE1234F1Z5');
      expect(after.bank.accountName).toBe('Store Owner');
      expect(after.bank.ifsc).toBe('HDFC0001234');
      // never persisted in the clear
      expect(JSON.stringify(after)).not.toContain('123456789012');
      expect(after.bank.accountNumberEnc).toBe(encryptAccountNumber('123456789012'));
    });

    test('does not clobber an existing account number when bank fields are edited without one', async () => {
      const { profile } = await createVendorUser();
      await VendorProfile.findByIdAndUpdate(profile._id, {
        $set: { bank: { accountNumberEnc: encryptAccountNumber('999888777666'), bankName: 'Old' } },
      });

      await request(app)
        .patch(`/api/v1/admin/vendors/${profile._id}`)
        .set('Authorization', await asAdmin())
        .send({ bank: { bankName: 'Renamed Bank' } });

      const after = await VendorProfile.findById(profile._id).lean();
      expect(after.bank.bankName).toBe('Renamed Bank');
      expect(after.bank.accountNumberEnc).toBe(encryptAccountNumber('999888777666'));
    });

    test('rejects a malformed IFSC', async () => {
      const { profile } = await createVendorUser();
      const res = await request(app)
        .patch(`/api/v1/admin/vendors/${profile._id}`)
        .set('Authorization', await asAdmin())
        .send({ bank: { ifsc: 'nope' } });
      expect(res.status).toBe(400);
    });

    test('404s for an unknown vendor', async () => {
      const res = await request(app)
        .patch('/api/v1/admin/vendors/507f1f77bcf86cd799439011')
        .set('Authorization', await asAdmin())
        .send({ storeName: 'Ghost' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /admin/vendors/:id', () => {
    test('soft-deletes the vendor and disables the login', async () => {
      const { user, profile } = await createVendorUser();

      const res = await request(app)
        .delete(`/api/v1/admin/vendors/${profile._id}`)
        .set('Authorization', await asAdmin());
      expect(res.status).toBe(200);

      // the plugin hides soft-deleted docs from normal queries, so opt in
      const after = await VendorProfile.findById(profile._id)
        .setOptions({ includeDeleted: true })
        .lean();
      expect(after.softDelete.isDeleted).toBe(true);

      const userAfter = await User.findById(user._id).lean();
      expect(userAfter.status).toBe('inactive');

      // and it drops out of the admin list
      const list = await request(app)
        .get('/api/v1/admin/vendors')
        .set('Authorization', await asAdmin());
      const ids = list.body.data.vendors.map((v) => v._id);
      expect(ids).not.toContain(String(profile._id));
    });
  });

  describe('GET /admin/vendors — computed display status', () => {
    test('distinguishes rejected from suspended in the list', async () => {
      const { profile: rejected } = await createVendorUser({ storeName: 'Rejected Store' });
      const { profile: suspended } = await createVendorUser({ storeName: 'Suspended Store' });

      await request(app)
        .post(`/api/v1/admin/vendors/${rejected._id}/reject`)
        .set('Authorization', await asAdmin())
        .send({ reason: 'no' });
      await request(app)
        .post(`/api/v1/admin/vendors/${suspended._id}/suspend`)
        .set('Authorization', await asAdmin())
        .send({ reason: 'no' });

      const list = await request(app)
        .get('/api/v1/admin/vendors?limit=100')
        .set('Authorization', await asAdmin());

      const byName = Object.fromEntries(list.body.data.vendors.map((v) => [v.storeName, v]));
      // both are stored as approvalStatus 'suspended'...
      expect(byName['Rejected Store'].approvalStatus).toBe('suspended');
      expect(byName['Suspended Store'].approvalStatus).toBe('suspended');
      // ...but the computed status tells them apart
      expect(byName['Rejected Store'].status).toBe('rejected');
      expect(byName['Suspended Store'].status).toBe('suspended');
    });

    test('commissionPercent is a number, not Decimal128 JSON', async () => {
      await createVendorUser();
      const list = await request(app)
        .get('/api/v1/admin/vendors')
        .set('Authorization', await asAdmin());
      const vendor = list.body.data.vendors[0];
      expect(typeof vendor.commissionPercent).toBe('number');
      expect(vendor.commissionPercent).toBe(10);
    });
  });
});

describe('admin visibility of vendor detail + KYC', () => {
  const app = createApp();
  let adminUser;
  const asAdmin = () => authHeaderFor(adminUser);

  const Attachment = require('../../src/database/models/Attachment');

  const seedFullVendor = async () => {
    const { profile } = await createVendorUser({ storeName: 'Full Store' });
    const att = await Attachment.create({
      ownerUserId: new mongoose.Types.ObjectId(),
      purpose: 'kyc_doc',
      storageKey: '/uploads/pan-scan.png',
      mime: 'image/png',
      sizeBytes: 2048,
      scanStatus: 'clean',
    });
    await VendorProfile.findByIdAndUpdate(profile._id, {
      $set: {
        panCard: 'ABCDE1234F',
        gstin: '23ABCDE1234F1Z5',
        bank: {
          accountName: 'Owner',
          bankName: 'HDFC',
          branch: 'Indore',
          ifsc: 'HDFC0001234',
          accountNumberEnc: encryptAccountNumber('123456789012'),
        },
        kycDocs: [{ type: 'pan', attachmentId: att._id }],
      },
    });
    return profile;
  };

  beforeEach(async () => {
    adminUser = await createAdminUser();
  });

  test('the list exposes every vendor field an admin needs', async () => {
    await seedFullVendor();
    const res = await request(app)
      .get('/api/v1/admin/vendors?limit=100')
      .set('Authorization', await asAdmin());

    const v = res.body.data.vendors.find((x) => x.storeName === 'Full Store');
    expect(v.user.refId).toMatch(/^SEM-VEN-/);
    expect(v.user.email).toBeTruthy();
    expect(v.panCard).toBe('ABCDE1234F');
    expect(v.gstin).toBe('23ABCDE1234F1Z5');
    expect(v.address.city).toBeTruthy();
    expect(v.status).toBeTruthy();
    expect(typeof v.commissionPercent).toBe('number');
  });

  test('KYC documents come back with a viewable url and metadata', async () => {
    const profile = await seedFullVendor();
    const res = await request(app)
      .get(`/api/v1/admin/vendors/${profile._id}`)
      .set('Authorization', await asAdmin());

    const [doc] = res.body.data.vendor.kycDocs;
    expect(doc.type).toBe('pan');
    // without a resolved url the admin cannot open what the vendor uploaded
    expect(doc.url).toBe('/uploads/pan-scan.png');
    expect(doc.mime).toBe('image/png');
    expect(doc.sizeBytes).toBe(2048);
    expect(doc.scanStatus).toBe('clean');
    expect(doc.uploadedAt).toBeTruthy();
  });

  test('the KYC url is present in the list too, not only the detail view', async () => {
    await seedFullVendor();
    const res = await request(app)
      .get('/api/v1/admin/vendors?limit=100')
      .set('Authorization', await asAdmin());
    const v = res.body.data.vendors.find((x) => x.storeName === 'Full Store');
    expect(v.kycDocs[0].url).toBe('/uploads/pan-scan.png');
  });

  test('the stored account-number hash is never sent to the client', async () => {
    const profile = await seedFullVendor();
    const hash = encryptAccountNumber('123456789012');

    const list = await request(app)
      .get('/api/v1/admin/vendors?limit=100')
      .set('Authorization', await asAdmin());
    const detail = await request(app)
      .get(`/api/v1/admin/vendors/${profile._id}`)
      .set('Authorization', await asAdmin());

    expect(JSON.stringify(list.body)).not.toContain(hash);
    expect(JSON.stringify(detail.body)).not.toContain(hash);
    expect(JSON.stringify(list.body)).not.toContain('accountNumberEnc');

    // admin still learns whether an account is on file, and the rest of the bank
    const v = detail.body.data.vendor;
    expect(v.bank.accountNumberMasked).toBe('****');
    expect(v.bank.ifsc).toBe('HDFC0001234');
    expect(v.bank.bankName).toBe('HDFC');
  });

  test('a vendor with no documents reports an empty list rather than failing', async () => {
    const { profile } = await createVendorUser({ storeName: 'Bare Store' });
    const res = await request(app)
      .get(`/api/v1/admin/vendors/${profile._id}`)
      .set('Authorization', await asAdmin());
    expect(res.status).toBe(200);
    expect(res.body.data.vendor.kycDocs).toEqual([]);
  });
});
