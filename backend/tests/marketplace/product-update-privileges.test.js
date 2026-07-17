const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../../src/app');
const { createVendorUser, createAdminUser, authHeaderFor } = require('../vendor/helpers');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const productService = require('../../src/modules/marketplace/services/product.service');

describe('PATCH /catalog/products/:id privilege boundaries', () => {
  const app = createApp();
  let vendorUser;
  let vendorProfile;
  let product;

  beforeEach(async () => {
    const created = await createVendorUser();
    vendorUser = created.user;
    vendorProfile = created.profile;

    const header = await taxonomyService.createHeaderCategory({ name: 'H' });
    const category = await taxonomyService.createCategory({ headerId: header._id, name: 'C' });

    product = await productService.createProduct(vendorProfile._id, {
      name: 'Vendor Product',
      sku: 'SNK-1',
      headerId: header._id,
      categoryId: category._id,
      pricePaise: 1000,
      images: [{ attachmentId: new mongoose.Types.ObjectId() }],
      approvalStatus: 'pending',
      publishStatus: 'draft',
      stock: 1,
    });
  });

  test('a vendor cannot self-approve their own product', async () => {
    const auth = await authHeaderFor(vendorUser);
    const res = await request(app)
      .patch(`/api/v1/catalog/products/${product._id}`)
      .set('Authorization', auth)
      .send({ name: 'Renamed', approvalStatus: 'approved' });

    expect(res.status).toBe(200);
    const after = await productService.getProduct(product._id);
    // The legitimate part of the edit still applies...
    expect(after.name).toBe('Renamed');
    // ...but moderation state is untouched.
    expect(after.approvalStatus).toBe('pending');
  });

  test('a vendor cannot reassign their product to another vendor', async () => {
    const { profile: otherVendor } = await createVendorUser({ storeName: 'Other Store' });
    const auth = await authHeaderFor(vendorUser);

    await request(app)
      .patch(`/api/v1/catalog/products/${product._id}`)
      .set('Authorization', auth)
      .send({ vendorId: otherVendor._id.toString() });

    const after = await productService.getProduct(product._id);
    expect(String(after.vendorId)).toBe(String(vendorProfile._id));
  });

  test('an admin CAN set approval state through the same route', async () => {
    const admin = await createAdminUser();
    const auth = await authHeaderFor(admin);

    const res = await request(app)
      .patch(`/api/v1/catalog/products/${product._id}`)
      .set('Authorization', auth)
      .send({ approvalStatus: 'approved' });

    expect(res.status).toBe(200);
    const after = await productService.getProduct(product._id);
    expect(after.approvalStatus).toBe('approved');
  });
});
