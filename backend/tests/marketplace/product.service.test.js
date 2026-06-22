const mongoose = require('mongoose');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const productService = require('../../src/modules/marketplace/services/product.service');
const HeaderCategory = require('../../src/database/models/HeaderCategory');
const VendorProfile = require('../../src/database/models/VendorProfile');

describe('marketplace taxonomy and products', () => {
  let vendorId;
  let headerId;
  let categoryId;

  beforeEach(async () => {
    const header = await taxonomyService.createHeaderCategory({ name: 'Uniforms' });
    headerId = header._id;
    const category = await taxonomyService.createCategory({ headerId, name: 'Boys Uniform' });
    categoryId = category._id;

    const vendor = await VendorProfile.create({
      userId: new mongoose.Types.ObjectId(),
      storeName: 'Test Vendor',
      storeSlug: 'test-vendor',
      commissionPercent: 10,
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
    vendorId = vendor._id;
  });

  test('creates category tree and product with inventory status', async () => {
    const tree = await taxonomyService.getCategoryTree('active');
    expect(tree).toHaveLength(1);
    expect(tree[0].categories[0].name).toBe('Boys Uniform');

    const product = await productService.createProduct(vendorId, {
      name: 'School Shirt',
      sku: 'SKU-001',
      headerId,
      categoryId,
      pricePaise: 49900,
      originalPricePaise: 59900,
      images: [{ attachmentId: new mongoose.Types.ObjectId(), alt: 'front' }],
      approvalStatus: 'approved',
      publishStatus: 'published',
      stock: 10,
      lowStockThreshold: 5,
      gradeTags: ['featured'],
    });

    expect(product.slug).toBeTruthy();
    const inventory = productService.getInventoryStatus(product);
    expect(inventory.stockStatus).toBe('in_stock');

    const offer = productService.getOfferDisplay(product);
    expect(offer.discountPaise).toBe(10000);

    const listed = await productService.listProducts({ featured: 'true' }, { publicOnly: true });
    expect(listed.data).toHaveLength(1);
  });
});
