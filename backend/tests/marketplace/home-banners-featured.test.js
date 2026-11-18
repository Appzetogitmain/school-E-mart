// This file signs in an admin and a vendor in the same test, so every token needs its own session id
// (the shared jest setup pins uuid to a constant, which makes the second sign-in collide).
let mockSeq = 0;
jest.mock('uuid', () => ({
  v4: jest.fn(() => `00000000-0000-4000-8000-${String((mockSeq += 1)).padStart(12, '0')}`),
}));

const request = require('supertest');
const mongoose = require('mongoose');
const { createApp } = require('../../src/app');
const { createVendorUser, createAdminUser, authHeaderFor } = require('../vendor/helpers');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const productService = require('../../src/modules/marketplace/services/product.service');
const Attachment = require('../../src/database/models/Attachment');

describe('home page: side banners and featured products', () => {
  const app = createApp();
  let admin;
  let adminAuth;
  let vendorUser;
  let vendorProfile;
  let headerId;
  let categoryId;

  const mkAttachment = (name) =>
    Attachment.create({
      ownerUserId: admin._id,
      purpose: 'banner_image',
      storageKey: `/uploads/${name}.png`,
      mime: 'image/png',
      sizeBytes: 100,
    });

  const bannerBody = (imageId, extra = {}) => {
    const now = new Date();
    const until = new Date(now);
    until.setFullYear(until.getFullYear() + 1);
    return {
      title: 'promo',
      imageId: String(imageId),
      targetAudience: 'parent',
      position: 'home_top',
      displayOrder: 0,
      validFrom: now.toISOString(),
      validUntil: until.toISOString(),
      status: 'active',
      ...extra,
    };
  };

  const mkProduct = (extra = {}) =>
    productService.createProduct(vendorProfile._id, {
      name: 'Notebook',
      sku: `NB-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      headerId,
      categoryId,
      pricePaise: 5000,
      stock: 10,
      images: [{ attachmentId: new mongoose.Types.ObjectId() }],
      approvalStatus: 'approved',
      publishStatus: 'published',
      audience: 'users',
      ...extra,
    });

  beforeEach(async () => {
    admin = await createAdminUser();
    adminAuth = await authHeaderFor(admin);
    const created = await createVendorUser();
    vendorUser = created.user;
    vendorProfile = created.profile;
    headerId = (await taxonomyService.createHeaderCategory({ name: 'Stationery' }))._id;
    categoryId = (await taxonomyService.createCategory({ headerId, name: 'Books' }))._id;
  });

  describe('banners', () => {
    test('admin can create a SIDE banner and the public API reports it as placement "side"', async () => {
      const main = await mkAttachment('main');
      const side = await mkAttachment('side');

      let res = await request(app).post('/api/v1/admin/cms/banners').set('Authorization', adminAuth)
        .send(bannerBody(main._id, { title: 'big', position: 'home_top' }));
      expect(res.status).toBe(201);
      res = await request(app).post('/api/v1/admin/cms/banners').set('Authorization', adminAuth)
        .send(bannerBody(side._id, { title: 'small', position: 'home_side' }));
      expect(res.status).toBe(201);

      res = await request(app).get('/api/v1/catalog/banners?audience=parent&limit=20');
      expect(res.status).toBe(200);
      const banners = res.body.data.banners || res.body.data;
      const byTitle = Object.fromEntries(banners.map((b) => [b.title, b]));
      expect(byTitle.big.placement).toBe('main');
      expect(byTitle.small.placement).toBe('side');
      expect(byTitle.small.imageUrl).toBe('/uploads/side.png');
    });

    test('a banner meant for schools is not shown to parents, "all" is shown to both', async () => {
      const a = await mkAttachment('a');
      await request(app).post('/api/v1/admin/cms/banners').set('Authorization', adminAuth)
        .send(bannerBody(a._id, { title: 'school-only', position: 'home_side', targetAudience: 'school' }));
      await request(app).post('/api/v1/admin/cms/banners').set('Authorization', adminAuth)
        .send(bannerBody(a._id, { title: 'everyone', position: 'home_side', targetAudience: 'all' }));

      const titles = async (audience) => {
        const res = await request(app).get(`/api/v1/catalog/banners?audience=${audience}`);
        return (res.body.data.banners || res.body.data).map((b) => b.title).sort();
      };
      expect(await titles('parent')).toEqual(['everyone']);
      expect(await titles('school')).toEqual(['everyone', 'school-only']);
    });

    test('an unknown position is still rejected', async () => {
      const a = await mkAttachment('a');
      const res = await request(app).post('/api/v1/admin/cms/banners').set('Authorization', adminAuth)
        .send(bannerBody(a._id, { position: 'left_side' }));
      expect(res.status).toBe(400);
    });

    test('an admin can move an existing banner from main to side', async () => {
      const a = await mkAttachment('a');
      const created = await request(app).post('/api/v1/admin/cms/banners').set('Authorization', adminAuth)
        .send(bannerBody(a._id, { title: 'movable' }));
      const id = created.body.data.banner?._id || created.body.data._id || created.body.data.id;
      const res = await request(app).patch(`/api/v1/admin/cms/banners/${id}`).set('Authorization', adminAuth)
        .send({ position: 'home_side' });
      expect(res.status).toBe(200);
      const list = await request(app).get('/api/v1/catalog/banners?audience=parent');
      const banners = list.body.data.banners || list.body.data;
      expect(banners.find((b) => b.title === 'movable').placement).toBe('side');
    });
  });

  describe('featured products', () => {
    const featuredNames = async (query = '') => {
      const res = await request(app).get(`/api/v1/catalog/products/featured?audience=users&limit=8${query}`);
      expect(res.status).toBe(200);
      return (res.body.data.products || res.body.data).map((p) => p.name).sort();
    };

    test('nothing is featured by default', async () => {
      await mkProduct({ name: 'Plain' });
      expect(await featuredNames()).toEqual([]);
    });

    test('admin marks a product featured through the product edit route, and it appears', async () => {
      const p = await mkProduct({ name: 'Star' });
      await mkProduct({ name: 'Plain' });
      const res = await request(app).patch(`/api/v1/catalog/products/${p._id}`).set('Authorization', adminAuth)
        .send({ isFeatured: true });
      expect(res.status).toBe(200);
      expect(await featuredNames()).toEqual(['Star']);

      await request(app).patch(`/api/v1/catalog/products/${p._id}`).set('Authorization', adminAuth)
        .send({ isFeatured: false });
      expect(await featuredNames()).toEqual([]);
    });

    test('a vendor cannot feature their own product (edit or create)', async () => {
      const p = await mkProduct({ name: 'Mine' });
      const vAuth = await authHeaderFor(vendorUser);
      const res = await request(app).patch(`/api/v1/catalog/products/${p._id}`).set('Authorization', vAuth)
        .send({ name: 'Mine 2', isFeatured: true });
      expect(res.status).toBe(200);
      const after = await productService.getProduct(p._id);
      expect(after.name).toBe('Mine 2');
      expect(after.isFeatured).toBe(false);

      const create = await request(app).post('/api/v1/catalog/products').set('Authorization', vAuth).send({
        name: 'Sneaky', sku: 'SNEAK-1', headerId: String(headerId), categoryId: String(categoryId),
        pricePaise: 1000, stock: 1, images: [{ attachmentId: String(new mongoose.Types.ObjectId()) }], isFeatured: true,
      });
      expect(create.status).toBe(201);
      const created = await productService.getProduct(create.body.data.product._id);
      expect(created.isFeatured).toBe(false);
    });

    test('only approved + published products are shown, even if featured', async () => {
      await mkProduct({ name: 'Visible', isFeatured: true });
      await mkProduct({ name: 'Draft', isFeatured: true, publishStatus: 'draft' });
      await mkProduct({ name: 'Pending', isFeatured: true, approvalStatus: 'pending' });
      expect(await featuredNames()).toEqual(['Visible']);
    });

    test('the audience chosen on a product is saved (it used to be silently dropped)', async () => {
      const p = await mkProduct({ name: 'Shared' });
      const res = await request(app).patch(`/api/v1/catalog/products/${p._id}`).set('Authorization', adminAuth)
        .send({ audience: 'both', isFeatured: true });
      expect(res.status).toBe(200);
      expect((await productService.getProduct(p._id)).audience).toBe('both');
      const schools = await request(app).get('/api/v1/catalog/products/featured?audience=schools&limit=8');
      expect((schools.body.data.products || schools.body.data).map((x) => x.name)).toEqual(['Shared']);
    });

    test('school-only products are not featured to parents, but are to schools', async () => {
      await mkProduct({ name: 'Retail', isFeatured: true, audience: 'users' });
      await mkProduct({ name: 'Bulk', isFeatured: true, audience: 'schools' });
      expect(await featuredNames()).toEqual(['Retail']);
      const res = await request(app).get('/api/v1/catalog/products/featured?audience=schools&limit=8');
      expect((res.body.data.products || res.body.data).map((p) => p.name)).toEqual(['Bulk']);
    });
  });
});
