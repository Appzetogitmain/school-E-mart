const mongoose = require('mongoose');
const vendorApprovalService = require('../../src/modules/admin/services/vendorApproval.service');
const User = require('../../src/database/models/User');
const VendorProfile = require('../../src/database/models/VendorProfile');

describe('vendorApprovalService.bulkImportVendors', () => {
  const actor = {
    userId: new mongoose.Types.ObjectId().toString(),
    role: 'admin',
  };

  test('successfully bulk imports valid vendors with graceful fallbacks', async () => {
    const timestamp = Date.now();
    const vendorsToImport = [
      {
        'Store Name': `Apex Uniforms ${timestamp}`,
        'Owner Name': 'Rajesh Sharma',
        Email: `rajesh_${timestamp}@test.com`,
        Phone: '9829012345',
        'Commission %': 12,
        City: 'Jaipur',
        State: 'Rajasthan',
        Pincode: '302001',
        Address: '12 MI Road',
      },
      {
        storeName: `National Book Depot ${timestamp}`,
        name: 'Sanjay Gupta',
        email: `sanjay_${timestamp}@test.com`,
        phone: '9876543210',
        // Optional fields left completely blank - should use defaults!
      },
    ];

    const result = await vendorApprovalService.bulkImportVendors(vendorsToImport, actor);

    expect(result).toBeDefined();
    expect(result.total).toBe(2);
    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(result.created).toHaveLength(2);

    // Verify first vendor in database
    const v1 = await VendorProfile.findOne({ storeName: `Apex Uniforms ${timestamp}` });
    expect(v1).toBeTruthy();
    expect(Number(v1.commissionPercent)).toBe(12);
    expect(v1.address.city).toBe('Jaipur');
    expect(v1.address.pinCode).toBe('302001');
    expect(v1.approvalStatus).toBe('approved');

    // Verify second vendor in database with default fallbacks
    const v2 = await VendorProfile.findOne({ storeName: `National Book Depot ${timestamp}` });
    expect(v2).toBeTruthy();
    expect(Number(v2.commissionPercent)).toBe(10); // default
    expect(v2.address.city).toBe('Pending'); // default placeholder
    expect(v2.approvalStatus).toBe('approved');
  });

  test('handles duplicate email/phone gracefully without aborting valid rows', async () => {
    const timestamp = Date.now();

    // Create an existing vendor first
    const existingPhone = '9811122233';
    const existingEmail = `existing_${timestamp}@test.com`;
    await vendorApprovalService.createVendor(
      {
        name: 'Existing Owner',
        storeName: `Existing Store ${timestamp}`,
        email: existingEmail,
        phone: existingPhone,
        password: 'Password123!',
      },
      actor
    );

    const batch = [
      {
        'Store Name': `Duplicate Phone Store ${timestamp}`,
        'Owner Name': 'Ramesh Kumar',
        Email: `new_email_${timestamp}@test.com`,
        Phone: existingPhone, // Duplicate phone!
      },
      {
        'Store Name': `Valid Store In Batch ${timestamp}`,
        'Owner Name': 'Sunil Verma',
        Email: `sunil_unique_${timestamp}@test.com`,
        Phone: '9844455566',
      },
      {
        'Store Name': '', // Missing required store name!
        'Owner Name': 'Missing Store',
        Email: `missing_${timestamp}@test.com`,
        Phone: '9877788899',
      },
    ];

    const result = await vendorApprovalService.bulkImportVendors(batch, actor);

    expect(result.total).toBe(3);
    expect(result.successCount).toBe(1);
    expect(result.failedCount).toBe(2);
    expect(result.created[0].storeName).toBe(`Valid Store In Batch ${timestamp}`);

    // Verify errors record exact rows
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0].row).toBe(1);
    expect(result.errors[0].error).toContain('already registered');
    expect(result.errors[1].row).toBe(3);
    expect(result.errors[1].error).toContain('Store Name is required');
  });
});
