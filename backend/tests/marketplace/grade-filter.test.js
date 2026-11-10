const mongoose = require('mongoose');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const productService = require('../../src/modules/marketplace/services/product.service');
const VendorProfile = require('../../src/database/models/VendorProfile');

// Client bug: a product tagged only for UKG was showing to a Nursery child.
// The parent app now sends the child's grade; this pins the backend contract it relies on.
describe('grade filter on the public product list', () => {
  let vendorId;
  let headerId;
  let categoryId;

  const make = (name, gradeTags) =>
    productService.createProduct(vendorId, {
      name,
      sku: `SKU-${name.replace(/\s+/g, '-').toUpperCase()}`,
      headerId,
      categoryId,
      pricePaise: 3000,
      stock: 5,
      approvalStatus: 'approved',
      publishStatus: 'published',
      ...(gradeTags ? { gradeTags } : {}),
    });

  const namesFor = async (query) =>
    (await productService.listProducts({ categoryId: String(categoryId), ...query }, { publicOnly: true })).data.map((p) => p.name).sort();

  beforeEach(async () => {
    const header = await taxonomyService.createHeaderCategory({ name: 'School Stationary' });
    headerId = header._id;
    categoryId = (await taxonomyService.createCategory({ headerId, name: 'Art Craft' }))._id;
    vendorId = (
      await VendorProfile.create({
        userId: new mongoose.Types.ObjectId(),
        storeName: 'V',
        storeSlug: 'v',
        commissionPercent: 10,
        approvalStatus: 'approved',
        address: { line1: 'L', city: 'C', state: 'S', country: 'India', pinCode: '110001' },
        location: { type: 'Point', coordinates: [77.2, 28.6] },
        serviceRadiusKm: 10,
      })
    )._id;
    await make('Dura Cell', ['UKG']);
    await make('Nursery Slate', ['Nursery']);
    await make('Both KG Crayons', ['Nursery', 'UKG']);
    await make('Everyone Pencil', ['All Grades']);
    await make('Untagged Eraser');
  });

  test('a UKG-only product is not returned for a Nursery child', async () => {
    const names = await namesFor({ grade: 'Nursery' });
    expect(names).not.toContain('Dura Cell');
    expect(names).toEqual(['Both KG Crayons', 'Everyone Pencil', 'Nursery Slate', 'Untagged Eraser']);
  });

  test('a UKG child gets the UKG products plus the all-grade and untagged ones', async () => {
    expect(await namesFor({ grade: 'UKG' })).toEqual(['Both KG Crayons', 'Dura Cell', 'Everyone Pencil', 'Untagged Eraser']);
  });

  test('grade match ignores case (profiles store NURSERY, vendors tag Nursery)', async () => {
    expect(await namesFor({ grade: 'NURSERY' })).toEqual(await namesFor({ grade: 'Nursery' }));
  });

  test('no grade means everything (guests and unlinked shoppers)', async () => {
    expect(await namesFor({})).toHaveLength(5);
  });

  // The rule the client asked for: a product made for one class shows ONLY in that class.
  test('Nursery, LKG and UKG products never leak into each other', async () => {
    await make('Only LKG Book', ['LKG']);
    const onlyTagged = (names) => names.filter((n) => ['Dura Cell', 'Nursery Slate', 'Only LKG Book'].includes(n));

    expect(onlyTagged(await namesFor({ grade: 'Nursery' }))).toEqual(['Nursery Slate']);
    expect(onlyTagged(await namesFor({ grade: 'LKG' }))).toEqual(['Only LKG Book']);
    expect(onlyTagged(await namesFor({ grade: 'UKG' }))).toEqual(['Dura Cell']);
    expect(onlyTagged(await namesFor({ grade: 'Class 1' }))).toEqual([]);
  });

  test('matching is exact, never a substring ("Class 1" must not match "Class 10")', async () => {
    await make('Class Ten Atlas', ['Class 10']);
    expect(await namesFor({ grade: 'Class 1' })).not.toContain('Class Ten Atlas');
    expect(await namesFor({ grade: 'Class 10' })).toContain('Class Ten Atlas');
  });
});

describe('related products respect the class too', () => {
  const recommendationService = require('../../src/modules/marketplace/services/recommendation.service');
  let vendorId;
  let headerId;
  let categoryId;

  const make = (name, gradeTags) =>
    productService.createProduct(vendorId, {
      name,
      sku: `REL-${name.replace(/\s+/g, '-').toUpperCase()}`,
      headerId,
      categoryId,
      pricePaise: 3000,
      stock: 5,
      approvalStatus: 'approved',
      publishStatus: 'published',
      ...(gradeTags ? { gradeTags } : {}),
    });

  beforeEach(async () => {
    headerId = (await taxonomyService.createHeaderCategory({ name: 'Stationary' }))._id;
    categoryId = (await taxonomyService.createCategory({ headerId, name: 'Pens' }))._id;
    vendorId = (
      await VendorProfile.create({
        userId: new mongoose.Types.ObjectId(),
        storeName: 'V2',
        storeSlug: 'v2',
        commissionPercent: 10,
        approvalStatus: 'approved',
        address: { line1: 'L', city: 'C', state: 'S', country: 'India', pinCode: '110001' },
        location: { type: 'Point', coordinates: [77.2, 28.6] },
        serviceRadiusKm: 10,
      })
    )._id;
  });

  test('a Nursery child is not suggested a UKG-only product, a UKG child is', async () => {
    const base = await make('Nursery Pencil', ['Nursery']);
    await make('UKG Pen', ['UKG']);
    await make('Nursery Crayon', ['Nursery']);
    await make('Any Class Ruler');

    const forNursery = (await recommendationService.getRelatedProducts(base._id, { grade: 'Nursery' })).map((p) => p.name).sort();
    expect(forNursery).toEqual(['Any Class Ruler', 'Nursery Crayon']);

    const forUkg = (await recommendationService.getRelatedProducts(base._id, { grade: 'UKG' })).map((p) => p.name).sort();
    expect(forUkg).toEqual(['Any Class Ruler', 'UKG Pen']);

    // no grade (guest): nothing is filtered out
    expect(await recommendationService.getRelatedProducts(base._id)).toHaveLength(3);
  });
});
