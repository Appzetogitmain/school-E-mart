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

  async getCategoryTree(status = 'active') {
    const headers = await headerCategoryRepository.findMany(
      status ? { status } : {},
      { sort: { displayOrder: 1 } }
    );
    const tree = await Promise.all(
      headers.map(async (header) => {
        const categories = await categoryRepository.findMany(
          { headerId: header._id, ...(status ? { status } : {}) },
          { sort: { displayOrder: 1 } }
        );
        const categoriesWithSubs = await Promise.all(
          categories.map(async (category) => ({
            ...category,
            subcategories: await subcategoryRepository.findMany(
              { categoryId: category._id, ...(status ? { status } : {}) },
              { sort: { displayOrder: 1 } }
            ),
          }))
        );
        return { ...header, categories: categoriesWithSubs };
      })
    );
    return tree;
  },
};

module.exports = taxonomyService;
