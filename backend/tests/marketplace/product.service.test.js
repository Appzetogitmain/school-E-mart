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

  test('search keeps the selected grade and audience filters', async () => {
    await productService.createProduct(vendorId, {
      name: 'Nursery Apple Bag', sku: 'BAG-NURSERY', headerId, categoryId,
      pricePaise: 10000, stock: 2, gradeTags: ['Nursery'], audience: 'schools',
    });
    await productService.createProduct(vendorId, {
      name: 'Class One Apple Bag', sku: 'BAG-ONE', headerId, categoryId,
      pricePaise: 10000, stock: 2, gradeTags: ['Class 1'], audience: 'schools',
    });
    await productService.createProduct(vendorId, {
      name: 'Nursery Apple Pencil', sku: 'PENCIL-NURSERY', headerId, categoryId,
      pricePaise: 10000, stock: 2, gradeTags: ['Nursery'], audience: 'users',
    });

    const result = await productService.listProducts(
      { q: 'Apple', grade: 'Nursery', audience: 'schools' },
      { publicOnly: true }
    );
    expect(result.data.map((product) => product.sku)).toEqual(['BAG-NURSERY']);
    expect(result.pagination.total).toBe(1);
  });
  test('products with audience=both are returned to both users and schools storefronts and respect class visibility', async () => {
    const sharedProduct = await productService.createProduct(vendorId, {
      name: 'Shared Both Uniform Shirt',
      sku: 'SHIRT-BOTH-NURSERY',
      headerId,
      categoryId,
      pricePaise: 45000,
      stock: 50,
      gradeTags: ['Nursery', 'All Grades'], // Should be normalized to ['Nursery']
      audience: 'both',
    });

    expect(sharedProduct.gradeTags).toEqual(['Nursery']);

    // Query from Parent storefront (audience: 'users') with grade: 'Nursery'
    const parentResult = await productService.listProducts(
      { grade: 'Nursery', audience: 'users' },
      { publicOnly: true }
    );
    const parentSkus = parentResult.data.map((p) => p.sku);
    expect(parentSkus).toContain('SHIRT-BOTH-NURSERY');

    // Query from School storefront (audience: 'schools') with grade: 'Nursery'
    const schoolResult = await productService.listProducts(
      { grade: 'Nursery', audience: 'schools' },
      { publicOnly: true }
    );
    const schoolSkus = schoolResult.data.map((p) => p.sku);
    expect(schoolSkus).toContain('SHIRT-BOTH-NURSERY');

    // Query with different grade (grade: 'Class 5') - Nursery product must NOT show up
    const class5Result = await productService.listProducts(
      { grade: 'Class 5', audience: 'users' },
      { publicOnly: true }
    );
    const class5Skus = class5Result.data.map((p) => p.sku);
    expect(class5Skus).not.toContain('SHIRT-BOTH-NURSERY');
  });
});
