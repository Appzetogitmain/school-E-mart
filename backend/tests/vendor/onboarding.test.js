jest.mock('uuid', () => ({ v4: () => require('crypto').randomUUID() }));

const request = require('supertest');
const { createApp } = require('../../src/app');
const { createVendorUser, authHeaderFor } = require('./helpers');
const VendorProfile = require('../../src/database/models/VendorProfile');
const { encryptAccountNumber } = require('../../src/modules/vendor/utils/bank');

describe('vendor self-service onboarding (completing data signup omitted)', () => {
  const app = createApp();
  let auth;
  let profile;

  beforeEach(async () => {
    const created = await createVendorUser({ approvalStatus: 'pending' });
    profile = created.profile;
    auth = await authHeaderFor(created.user);
  });

  test('a pending vendor can read their own profile', async () => {
    const res = await request(app).get('/api/v1/vendor/me/profile').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body.data.profile.storeName).toBeTruthy();
  });

  test('address can be completed field by field and merges with what exists', async () => {
    const res = await request(app)
      .patch('/api/v1/vendor/me/address')
      .set('Authorization', auth)
      .send({ city: 'Bhopal', state: 'MP', pinCode: '462001' });

    expect(res.status).toBe(200);
    const after = await VendorProfile.findById(profile._id).lean();
    expect(after.address.city).toBe('Bhopal');
    expect(after.address.pinCode).toBe('462001');
    // untouched fields survive
    expect(after.address.line1).toBe('123 Test St');
  });

  test('address update can set map coordinates', async () => {
    const res = await request(app)
      .patch('/api/v1/vendor/me/address')
      .set('Authorization', auth)
      .send({ latitude: 22.7196, longitude: 75.8577 });

    expect(res.status).toBe(200);
    const after = await VendorProfile.findById(profile._id).lean();
    // stored GeoJSON order is [lng, lat]
    expect(after.location.coordinates[0]).toBeCloseTo(75.8577);
    expect(after.location.coordinates[1]).toBeCloseTo(22.7196);
  });

  test('tax info can be filled in', async () => {
    const res = await request(app)
      .patch('/api/v1/vendor/me/tax')
      .set('Authorization', auth)
      .send({ panCard: 'ABCDE1234F', gstin: '23ABCDE1234F1Z5' });

    expect(res.status).toBe(200);
    const after = await VendorProfile.findById(profile._id).lean();
    expect(after.panCard).toBe('ABCDE1234F');
    expect(after.gstin).toBe('23ABCDE1234F1Z5');
  });

  test('a malformed PAN is rejected', async () => {
    const res = await request(app)
      .patch('/api/v1/vendor/me/tax')
      .set('Authorization', auth)
      .send({ panCard: 'nope' });
    expect(res.status).toBe(400);
  });

  test('bank details save, and the account number is never stored or returned in the clear', async () => {
    const res = await request(app)
      .patch('/api/v1/vendor/me/bank')
      .set('Authorization', auth)
      .send({
        accountName: 'Test Vendor',
        bankName: 'HDFC',
        branch: 'Indore',
        ifsc: 'HDFC0001234',
        accountNumber: '123456789012',
      });

    expect(res.status).toBe(200);
    const after = await VendorProfile.findById(profile._id).lean();
    expect(after.bank.ifsc).toBe('HDFC0001234');
    expect(after.bank.accountNumberEnc).toBe(encryptAccountNumber('123456789012'));
    expect(JSON.stringify(after)).not.toContain('123456789012');

    // and reading the profile back never leaks the hash
    const read = await request(app).get('/api/v1/vendor/me/profile').set('Authorization', auth);
    expect(read.body.data.profile.bank.accountNumberEnc).toBeUndefined();
    expect(read.body.data.profile.bank.accountNumberMasked).toBe('****');
  });

  test('business info (store name + radius) can be updated', async () => {
    const res = await request(app)
      .patch('/api/v1/vendor/me/business')
      .set('Authorization', auth)
      .send({ storeName: 'Renamed Store', serviceRadiusKm: 25 });

    expect(res.status).toBe(200);
    const after = await VendorProfile.findById(profile._id).lean();
    expect(after.storeName).toBe('Renamed Store');
    expect(after.serviceRadiusKm).toBe(25);
  });

  test('status endpoint reports approval state and kyc count', async () => {
    const res = await request(app).get('/api/v1/vendor/me/status').set('Authorization', auth);
    expect(res.status).toBe(200);
    expect(res.body.data.status.approvalStatus).toBe('pending');
    expect(res.body.data.status.kycDocsCount).toBe(0);
  });

  describe('KYC document upload', () => {
    test('a vendor can upload a document and attach it to their profile', async () => {
      const upload = await request(app)
        .post('/api/v1/vendor/me/uploads')
        .set('Authorization', auth)
        .attach('file', Buffer.from('fake-png-bytes'), { filename: 'pan.png', contentType: 'image/png' });

      expect(upload.status).toBe(201);
      const attachmentId = upload.body.data.attachment._id;
      expect(attachmentId).toBeTruthy();
      expect(upload.body.data.attachment.purpose).toBe('kyc_doc');

      const attach = await request(app)
        .post('/api/v1/vendor/me/documents')
        .set('Authorization', auth)
        .send({ type: 'pan', attachmentId });

      expect(attach.status).toBe(200);
      const after = await VendorProfile.findById(profile._id).lean();
      expect(after.kycDocs).toHaveLength(1);
      expect(after.kycDocs[0].type).toBe('pan');
    });

    test('a PDF is accepted (KYC scans are often PDFs)', async () => {
      const res = await request(app)
        .post('/api/v1/vendor/me/uploads')
        .set('Authorization', auth)
        .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'gst.pdf', contentType: 'application/pdf' });
      expect(res.status).toBe(201);
    });

    test('upload requires auth', async () => {
      const res = await request(app)
        .post('/api/v1/vendor/me/uploads')
        .attach('file', Buffer.from('x'), { filename: 'a.png', contentType: 'image/png' });
      expect(res.status).toBe(401);
    });
  });
});
