const mongoose = require('mongoose');
const wishlistService = require('../../src/modules/marketplace/services/wishlist.service');
const productService = require('../../src/modules/marketplace/services/product.service');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const VendorProfile = require('../../src/database/models/VendorProfile');

describe('wishlistService', () => {
  let userId;
  let productId;

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    const header = await taxonomyService.createHeaderCategory({ name: 'Stationery' });
    const category = await taxonomyService.createCategory({ headerId: header._id, name: 'Pens' });
    const vendor = await VendorProfile.create({
      userId: new mongoose.Types.ObjectId(),
      storeName: 'Stationery Vendor',
      storeSlug: 'stationery-vendor',
      commissionPercent: 5,
      approvalStatus: 'approved',
      address: {
        line1: 'Line 1',
        city: 'City',
        state: 'State',
        country: 'India',
        pinCode: '110001',
      },
      location: { type: 'Point', coordinates: [77.2, 28.6] },
      serviceRadiusKm: 10,
    });

    const product = await productService.createProduct(vendor._id, {
      name: 'Blue Pen',
      sku: 'PEN-001',
      headerId: header._id,
      categoryId: category._id,
      pricePaise: 1000,
      images: [{ attachmentId: new mongoose.Types.ObjectId() }],
      approvalStatus: 'approved',
      publishStatus: 'published',
      stock: 100,
    });
    productId = product._id;
  });

  test('prevents duplicate wishlist entries', async () => {
    await wishlistService.addItem(userId, 'parent', productId);
    await expect(wishlistService.addItem(userId, 'parent', productId)).rejects.toMatchObject({
      code: 'WISHLIST_DUPLICATE',
    });

    const result = await wishlistService.listWishlist(userId, 'parent');
    expect(result.products).toHaveLength(1);

    await wishlistService.removeItem(userId, 'parent', productId);
    const afterRemove = await wishlistService.listWishlist(userId, 'parent');
    expect(afterRemove.products).toHaveLength(0);
  });
});
