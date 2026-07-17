const request = require('supertest');
const { createApp } = require('../../src/app');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');

describe('GET /catalog/categories/tree status filtering', () => {
  const app = createApp();

  beforeEach(async () => {
    const header = await taxonomyService.createHeaderCategory({ name: 'Books' });
    const activeCat = await taxonomyService.createCategory({
      headerId: header._id,
      name: 'Textbooks',
      status: 'active',
    });
    await taxonomyService.createCategory({
      headerId: header._id,
      name: 'Retired Shelf',
      status: 'inactive',
    });
    await taxonomyService.createSubcategory({
      categoryId: activeCat._id,
      name: 'Retired Sub',
      status: 'inactive',
    });
    await taxonomyService.createSubcategory({
      categoryId: activeCat._id,
      name: 'Live Sub',
      status: 'active',
    });
  });

  const names = (tree) => tree.flatMap((h) => h.categories.map((c) => c.name));
  const subNames = (tree) =>
    tree.flatMap((h) => h.categories.flatMap((c) => (c.subcategories || []).map((s) => s.name)));

  test('default (public) hides inactive nodes', async () => {
    const res = await request(app).get('/api/v1/catalog/categories/tree');
    expect(res.status).toBe(200);
    const { tree } = res.body.data;
    expect(names(tree)).toEqual(['Textbooks']);
    expect(subNames(tree)).toEqual(['Live Sub']);
  });

  test('status=all returns inactive nodes so admin can manage them', async () => {
    const res = await request(app).get('/api/v1/catalog/categories/tree?status=all');
    expect(res.status).toBe(200);
    const { tree } = res.body.data;
    expect(names(tree).sort()).toEqual(['Retired Shelf', 'Textbooks']);
    expect(subNames(tree).sort()).toEqual(['Live Sub', 'Retired Sub']);
  });

  test('status=inactive still works as an explicit filter', async () => {
    const res = await request(app).get('/api/v1/catalog/categories/tree?status=inactive');
    expect(res.status).toBe(200);
    expect(names(res.body.data.tree)).toEqual([]);
  });
});
