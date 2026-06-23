const mongoose = require('mongoose');
const registrationService = require('../../src/modules/vendor/services/registration.service');
const profileService = require('../../src/modules/vendor/services/profile.service');
const VendorProfile = require('../../src/database/models/VendorProfile');

describe('vendor registration and profile', () => {
  test('registers a new vendor with pending status', async () => {
    const result = await registrationService.register({
      name: 'John Vendor',
      storeName: 'John Supplies',
      phone: '9876543210',
      email: 'john.vendor@test.com',
      password: 'Vendor@123',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
    });

    expect(result.user.refId).toMatch(/^SEM-VEN-/);
    expect(result.profile.storeName).toBe('John Supplies');
    expect(result.profile.status).toBe('pending');

    const profile = await profileService.getProfile(result.user.id);
    expect(profile.storeName).toBe('John Supplies');
  });

  test('rejects duplicate email on registration', async () => {
    await registrationService.register({
      name: 'Vendor One',
      storeName: 'Store One',
      phone: '9876543211',
      email: 'dup@test.com',
      password: 'Vendor@123',
    });

    await expect(
      registrationService.register({
        name: 'Vendor Two',
        storeName: 'Store Two',
        phone: '9876543212',
        email: 'dup@test.com',
        password: 'Vendor@123',
      })
    ).rejects.toMatchObject({ code: 'EMAIL_EXISTS' });
  });

  test('updates tax and bank details', async () => {
    const { user } = await registrationService.register({
      name: 'Tax Vendor',
      storeName: 'Tax Store',
      phone: '9876543213',
      email: 'tax@test.com',
      password: 'Vendor@123',
    });

    await profileService.updateTaxInfo(user.id, {
      gstin: '22AAAAA0000A1Z5',
      panCard: 'ABCDE1234F',
    });

    const bank = await profileService.updateBankDetails(user.id, {
      accountName: 'Tax Vendor',
      bankName: 'Test Bank',
      ifsc: 'HDFC0001234',
      accountNumber: '123456789012',
    });

    expect(bank.bank.ifsc).toBe('HDFC0001234');
    expect(bank.bank.accountNumberMasked).toBe('****9012');
  });

  test('maps under_review status when kyc docs exist', async () => {
    const { user, profile } = await registrationService.register({
      name: 'KYC Vendor',
      storeName: 'KYC Store',
      phone: '9876543214',
      email: 'kyc@test.com',
      password: 'Vendor@123',
    });

    await profileService.addDocument(user.id, {
      type: 'gst_certificate',
      attachmentId: new mongoose.Types.ObjectId(),
    });

    const status = await profileService.getStatus(user.id);
    expect(status.status).toBe('under_review');
  });
});
