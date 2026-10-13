const mongoose = require('mongoose');
const VendorProfile = require('../../src/database/models/VendorProfile');
const vendorDirectoryService = require('../../src/modules/school/services/vendorDirectory.service');

describe('school active vendor count', () => {
  test('pagination total counts all approved vendors, not just the first page', async () => {
    await VendorProfile.insertMany(['approved', 'approved', 'suspended'].map((approvalStatus, index) => ({
      userId: new mongoose.Types.ObjectId(),
      storeName: `Vendor ${index}`,
      storeSlug: `count-vendor-${index}`,
      commissionPercent: 10,
      approvalStatus,
      address: { line1: 'Street', city: 'Delhi', state: 'Delhi', country: 'India', pinCode: '110001' },
      location: { type: 'Point', coordinates: [77.2, 28.6] },
      serviceRadiusKm: 10,
    })));

    const result = await vendorDirectoryService.listApprovedVendors({ limit: 1 });
    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(2);
  });
});
