const mongoose = require('mongoose');
const cartService = require('../../src/modules/marketplace/services/cart.service');
const productService = require('../../src/modules/marketplace/services/product.service');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const VendorProfile = require('../../src/database/models/VendorProfile');

describe('cartService', () => {
  let userId;
  let productId;

  beforeEach(async () => {
    userId = new mongoose.Types.ObjectId();
    const header = await taxonomyService.createHeaderCategory({ name: 'Books' });
    const category = await taxonomyService.createCategory({ headerId: header._id, name: 'Textbooks' });
    const vendor = await VendorProfile.create({
      userId: new mongoose.Types.ObjectId(),
      storeName: 'Book Vendor',
      storeSlug: 'book-vendor',
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
      name: 'Math Book',
      sku: 'BOOK-001',
      headerId: header._id,
      categoryId: category._id,
      pricePaise: 25000,
      images: [{ attachmentId: new mongoose.Types.ObjectId() }],
      approvalStatus: 'approved',
      publishStatus: 'published',
      stock: 20,
    });
    productId = product._id;
  });

  test('adds, updates, and clears cart without duplicate variant entries', async () => {
    await cartService.addItem(userId, 'parent', { productId, quantity: 1 });
    const updated = await cartService.addItem(userId, 'parent', { productId, quantity: 2 });
    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].quantity).toBe(3);

    const cart = await cartService.updateItemQuantity(userId, 'parent', productId, null, 2);
    expect(cart.items[0].quantity).toBe(2);

    const summary = await cartService.getCartSummary(userId, 'parent');
    expect(summary.itemCount).toBe(2);
    expect(summary.totalPaise).toBe(50000);

    const cleared = await cartService.clearCart(userId, 'parent');
    expect(cleared.items).toHaveLength(0);
  });
});
