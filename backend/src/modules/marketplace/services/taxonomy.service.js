const { NotFoundError } = require('../../../common/errors');
const headerCategoryRepository = require('../repositories/headerCategory.repository');
const categoryRepository = require('../repositories/category.repository');
const subcategoryRepository = require('../repositories/subcategory.repository');
const { uniqueSlug } = require('../utils/slug');
const HeaderCategory = require('../../../database/models/HeaderCategory');
const Category = require('../../../database/models/Category');
const Subcategory = require('../../../database/models/Subcategory');

const taxonomyService = {
  async createHeaderCategory(payload) {
    const slug = await uniqueSlug(HeaderCategory, payload.name);
    const headers = await headerCategoryRepository.findMany({});
    return headerCategoryRepository.create({
      ...payload,
      slug,
      displayOrder: payload.displayOrder ?? headers.length + 1,
    });
  },

  listHeaderCategories(query) {
    const filter = {};
    if (query.status) filter.status = query.status;
    return headerCategoryRepository.paginate(filter, query);
  },

  async getHeaderCategory(id) {
    const item = await headerCategoryRepository.findById(id);
    if (!item) throw new NotFoundError('Header category not found', 'HEADER_CATEGORY_NOT_FOUND');
    return item;
  },

  async updateHeaderCategory(id, payload) {
    const item = await headerCategoryRepository.updateById(id, { $set: payload });
    if (!item) throw new NotFoundError('Header category not found', 'HEADER_CATEGORY_NOT_FOUND');
    return item;
  },

  async deleteHeaderCategory(id, deletedBy) {
    const item = await headerCategoryRepository.softDeleteById(id, { deletedBy });
    if (!item) throw new NotFoundError('Header category not found', 'HEADER_CATEGORY_NOT_FOUND');
    return item;
  },

  reorderHeaderCategories(orderedIds) {
    return headerCategoryRepository.reorder(orderedIds);
  },

  async createCategory(payload) {
    await this.getHeaderCategory(payload.headerId);
    const slug = await uniqueSlug(Category, payload.name);
    const siblings = await categoryRepository.findByHeader(payload.headerId);
    return categoryRepository.create({
      ...payload,
      slug,
      displayOrder: payload.displayOrder ?? siblings.length + 1,
    });
  },

  listCategories(query) {
    const filter = {};
    if (query.headerId) filter.headerId = query.headerId;
    if (query.status) filter.status = query.status;
    return categoryRepository.paginate(filter, query);
  },

  async getCategory(id) {
    const item = await categoryRepository.findById(id);
    if (!item) throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    return item;
  },

  async updateCategory(id, payload) {
    const item = await categoryRepository.updateById(id, { $set: payload });
    if (!item) throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    return item;
  },

  async deleteCategory(id, deletedBy) {
    const item = await categoryRepository.softDeleteById(id, { deletedBy });
    if (!item) throw new NotFoundError('Category not found', 'CATEGORY_NOT_FOUND');
    return item;
  },

  reorderCategories(headerId, orderedIds) {
    return categoryRepository.reorder(headerId, orderedIds);
  },

  async createSubcategory(payload) {
    await this.getCategory(payload.categoryId);
    const slug = await uniqueSlug(Subcategory, payload.name);
    const siblings = await subcategoryRepository.findByCategory(payload.categoryId);
    return subcategoryRepository.create({
      ...payload,
      slug,
      displayOrder: payload.displayOrder ?? siblings.length + 1,
    });
  },

  listSubcategories(query) {
    const filter = {};
    if (query.categoryId) filter.categoryId = query.categoryId;
    if (query.status) filter.status = query.status;
    return subcategoryRepository.paginate(filter, query);
  },

  async getSubcategory(id) {
    const item = await subcategoryRepository.findById(id);
    if (!item) throw new NotFoundError('Subcategory not found', 'SUBCATEGORY_NOT_FOUND');
    return item;
  },

  async updateSubcategory(id, payload) {
    const item = await subcategoryRepository.updateById(id, { $set: payload });
    if (!item) throw new NotFoundError('Subcategory not found', 'SUBCATEGORY_NOT_FOUND');
    return item;
  },

  async deleteSubcategory(id, deletedBy) {
    const item = await subcategoryRepository.softDeleteById(id, { deletedBy });
    if (!item) throw new NotFoundError('Subcategory not found', 'SUBCATEGORY_NOT_FOUND');
    return item;
  },

  reorderSubcategories(categoryId, orderedIds) {
    return subcategoryRepository.reorder(categoryId, orderedIds);
  },

  // Was 1 + N(headers) + N(categories) sequential-per-parent round-trips.
  // Batch each level with a single $in query instead, then assemble the
  // tree in memory — same result, 3 queries total regardless of size.
  async getCategoryTree(status = 'active') {
    const statusFilter = status ? { status } : {};

    const headers = await headerCategoryRepository.findMany(statusFilter, {
      sort: { displayOrder: 1 },
    });

    const headerIds = headers.map((h) => h._id);
    const categories = headerIds.length
      ? await categoryRepository.findMany(
          { headerId: { $in: headerIds }, ...statusFilter },
          { sort: { displayOrder: 1 } }
        )
      : [];

    const categoryIds = categories.map((c) => c._id);
    const subcategories = categoryIds.length
      ? await subcategoryRepository.findMany(
          { categoryId: { $in: categoryIds }, ...statusFilter },
          { sort: { displayOrder: 1 } }
        )
      : [];

    const subsByCategoryId = new Map();
    for (const sub of subcategories) {
      const key = String(sub.categoryId);
      if (!subsByCategoryId.has(key)) subsByCategoryId.set(key, []);
      subsByCategoryId.get(key).push(sub);
    }

    const categoriesByHeaderId = new Map();
    for (const category of categories) {
      const key = String(category.headerId);
      const withSubs = { ...category, subcategories: subsByCategoryId.get(String(category._id)) || [] };
      if (!categoriesByHeaderId.has(key)) categoriesByHeaderId.set(key, []);
      categoriesByHeaderId.get(key).push(withSubs);
    }

    return headers.map((header) => ({
      ...header,
      categories: categoriesByHeaderId.get(String(header._id)) || [],
    }));
  },
};

module.exports = taxonomyService;
