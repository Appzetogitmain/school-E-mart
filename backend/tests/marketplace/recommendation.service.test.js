const mongoose = require('mongoose');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const productService = require('../../src/modules/marketplace/services/product.service');
const recommendationService = require('../../src/modules/marketplace/services/recommendation.service');
const VendorProfile = require('../../src/database/models/VendorProfile');
const Attachment = require('../../src/database/models/Attachment');

// Bug: "Similar Products" showed a placeholder instead of the photo because the
// recommendation queries did not populate images[].attachmentId.
describe('recommendation service', () => {
  let vendorId;
  let headerId;
  let categoryId;
  let ownerUserId;

  const makeProduct = async (name, extra = {}) =>
    productService.createProduct(vendorId, {
      name,
      sku: `SKU-${name.replace(/\s+/g, '-').toUpperCase()}`,
      headerId,
      categoryId,
      pricePaise: 10000,
      stock: 5,
      approvalStatus: 'approved',
      publishStatus: 'published',
      ...extra,
    });

  beforeEach(async () => {
    ownerUserId = new mongoose.Types.ObjectId();
    const header = await taxonomyService.createHeaderCategory({ name: 'Stationery' });
    headerId = header._id;
    const category = await taxonomyService.createCategory({ headerId, name: 'Art Craft' });
    categoryId = category._id;
    const vendor = await VendorProfile.create({
      userId: ownerUserId,
      storeName: 'Test Vendor',
      storeSlug: 'test-vendor',
      commissionPercent: 10,
      approvalStatus: 'approved',
      address: { line1: 'L1', city: 'C', state: 'S', country: 'India', pinCode: '110001' },
      location: { type: 'Point', coordinates: [77.2, 28.6] },
      serviceRadiusKm: 10,
    });
    vendorId = vendor._id;
  });

  const withImage = async (name, key, extra = {}) => {
    const attachment = await Attachment.create({
      ownerUserId,
      purpose: 'product_image',
      storageKey: key,
      mime: 'image/png',
      sizeBytes: 10,
      scanStatus: 'clean',
    });
    return makeProduct(name, { images: [{ attachmentId: attachment._id, alt: name }], ...extra });
  };

  test('related products come back with the image storageKey populated', async () => {
    const base = await makeProduct('Base Art Kit');
    await withImage('Sketch Pen', '/uploads/sketch-pen.png');

    const related = await recommendationService.getRelatedProducts(base._id);

    expect(related).toHaveLength(1);
    expect(related[0].images[0].attachmentId.storageKey).toBe('/uploads/sketch-pen.png');
  });

  test('similar and recently-viewed products also populate images', async () => {
    const base = await makeProduct('Base Art Kit');
    const other = await withImage('Crayons', '/uploads/crayons.png');

    const similar = await recommendationService.getSimilarProducts(base._id);
    expect(similar[0].images[0].attachmentId.storageKey).toBe('/uploads/crayons.png');

    const userId = new mongoose.Types.ObjectId();
    await recommendationService.recordProductView(userId, 'parent', other._id);
    const recent = await recommendationService.getRecentlyViewed(userId, 'parent');
    expect(recent[0].images[0].attachmentId.storageKey).toBe('/uploads/crayons.png');
  });

  test('limit is honoured and capped', async () => {
    const base = await makeProduct('Base Art Kit');
    for (let i = 0; i < 5; i += 1) await makeProduct(`Pen ${i}`);

    expect(await recommendationService.getRelatedProducts(base._id, { limit: 2 })).toHaveLength(2);
    expect(await recommendationService.getRelatedProducts(base._id, { limit: 'abc' })).toHaveLength(5);
  });

  test('audience keeps school-bulk products out of the parent app and vice versa', async () => {
    const base = await makeProduct('Base Art Kit');
    await makeProduct('Retail Pen', { audience: 'users' });
    await makeProduct('Bulk Pen Box', { audience: 'schools' });
    await makeProduct('Both Pen', { audience: 'both' });

    const forParents = (await recommendationService.getRelatedProducts(base._id, { audience: 'users' })).map((p) => p.name);
    expect(forParents).toEqual(expect.arrayContaining(['Retail Pen', 'Both Pen']));
    expect(forParents).not.toContain('Bulk Pen Box');

    const forSchools = (await recommendationService.getRelatedProducts(base._id, { audience: 'schools' })).map((p) => p.name);
    expect(forSchools).toEqual(expect.arrayContaining(['Bulk Pen Box', 'Both Pen']));
    expect(forSchools).not.toContain('Retail Pen');
  });

  test('unknown product returns an empty list', async () => {
    expect(await recommendationService.getRelatedProducts(new mongoose.Types.ObjectId())).toEqual([]);
  });
});
