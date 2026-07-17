const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../../src/app');
const {
  createAdminUser,
  createVendorUser,
  authHeaderFor,
} = require('../vendor/helpers');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const productService = require('../../src/modules/marketplace/services/product.service');
const Attachment = require('../../src/database/models/Attachment');

describe('GET /catalog/admin/products', () => {
  const app = createApp();
  let adminUser;

  // uuid.v4 is mocked to a constant in jest.setup, so every session shares a jti.
  // Mint at most one session per test to avoid a duplicate-key collision.
  const asAdmin = async () => authHeaderFor(adminUser);

  beforeEach(async () => {
    adminUser = await createAdminUser();

    const { profile: vendor } = await createVendorUser({ storeName: 'Acme Store' });
    const header = await taxonomyService.createHeaderCategory({ name: 'Accessories' });
    const category = await taxonomyService.createCategory({ headerId: header._id, name: 'Bags' });
    const sub = await taxonomyService.createSubcategory({ categoryId: category._id, name: 'Backpacks' });
    const attachment = await Attachment.create({
      ownerUserId: new mongoose.Types.ObjectId(),
      purpose: 'product_image',
      storageKey: '/uploads/bag.png',
      mime: 'image/png',
      sizeBytes: 1024,
      scanStatus: 'clean',
    });

    const base = {
      headerId: header._id,
      categoryId: category._id,
      subcategoryId: sub._id,
      pricePaise: 25000,
      images: [{ attachmentId: attachment._id }],
      stock: 20,
    };

    await productService.createProduct(vendor._id, {
      ...base, name: 'Approved Bag', sku: 'A-1', approvalStatus: 'approved', publishStatus: 'published',
    });
    await productService.createProduct(vendor._id, {
      ...base, name: 'Pending Bag', sku: 'P-1', approvalStatus: 'pending', publishStatus: 'draft',
    });
    await productService.createProduct(vendor._id, {
      ...base, name: 'Rejected Bag', sku: 'R-1', approvalStatus: 'rejected', publishStatus: 'draft',
    });
  });

  test('requires auth — must not leak unapproved products publicly', async () => {
    const res = await request(app).get('/api/v1/catalog/admin/products');
    expect(res.status).toBe(401);
  });

  test('rejects a non-admin caller', async () => {
    const { user } = await createVendorUser();
    const vendorAuth = await authHeaderFor(user);
    const res = await request(app)
      .get('/api/v1/catalog/admin/products')
      .set('Authorization', vendorAuth);
    expect(res.status).toBe(403);
  });

  test('returns products in every moderation state', async () => {
    const res = await request(app)
      .get('/api/v1/catalog/admin/products?limit=100')
      .set('Authorization', await asAdmin());
    expect(res.status).toBe(200);
    const names = res.body.data.products.map((p) => p.name).sort();
    expect(names).toEqual(['Approved Bag', 'Pending Bag', 'Rejected Bag']);
  });

  test('resolves taxonomy, vendor and image refs into names/urls', async () => {
    const res = await request(app)
      .get('/api/v1/catalog/admin/products?approvalStatus=approved')
      .set('Authorization', await asAdmin());
    const product = res.body.data.products[0];

    expect(product.headerName).toBe('Accessories');
    expect(product.categoryName).toBe('Bags');
    expect(product.subcategoryName).toBe('Backpacks');
    expect(product.vendorName).toBe('Acme Store');
    expect(product.images[0].url).toBe('/uploads/bag.png');
    // ids must survive as ids, not populated objects
    expect(typeof product.categoryId).toBe('string');
    expect(typeof product.vendorId).toBe('string');
  });

  test('filters by approvalStatus', async () => {
    const res = await request(app)
      .get('/api/v1/catalog/admin/products?approvalStatus=pending')
      .set('Authorization', await asAdmin());
    expect(res.body.data.products.map((p) => p.name)).toEqual(['Pending Bag']);
  });

  test('public /products route is unchanged — still approved+published only', async () => {
    const res = await request(app).get('/api/v1/catalog/products?limit=100');
    expect(res.body.data.products.map((p) => p.name)).toEqual(['Approved Bag']);
  });

  test('public route ignores an injected approvalStatus filter', async () => {
    const res = await request(app).get('/api/v1/catalog/products?approvalStatus=pending&limit=100');
    const names = res.body.data.products.map((p) => p.name);
    expect(names).not.toContain('Pending Bag');
  });
});
