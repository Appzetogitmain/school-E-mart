const MasterKitProduct = require('../../../database/models/MasterKitProduct');
const { NotFoundError } = require('../../../common/errors');
const { executePaginatedQuery } = require('../../../repositories/query');

const masterKitProductService = {
  async createProduct(payload) {
    return MasterKitProduct.create(payload);
  },

  async listProducts(query = {}) {
    const filter = { 'softDelete.isDeleted': { $ne: true } };
    if (query.category && query.category !== 'All') {
      filter.category = query.category;
    }
    if (query.subcategory) {
      filter.subcategory = query.subcategory;
    }
    if (query.search) {
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    }

    return executePaginatedQuery(MasterKitProduct, filter, query, {
      defaultSort: '-audit.createdAt',
    });
  },

  async getProduct(id) {
    const product = await MasterKitProduct.findOne({ _id: id, 'softDelete.isDeleted': { $ne: true } });
    if (!product) throw new NotFoundError('Master Kit Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  async updateProduct(id, payload) {
    const product = await MasterKitProduct.findOneAndUpdate(
      { _id: id, 'softDelete.isDeleted': { $ne: true } },
      { $set: payload },
      { returnDocument: 'after' }
    );
    if (!product) throw new NotFoundError('Master Kit Product not found', 'PRODUCT_NOT_FOUND');
    return product;
  },

  async deleteProduct(id) {
    const product = await MasterKitProduct.findOneAndUpdate(
      { _id: id, 'softDelete.isDeleted': { $ne: true } },
      { $set: { 'softDelete.isDeleted': true, 'softDelete.deletedAt': new Date() } },
      { returnDocument: 'after' }
    );
    if (!product) throw new NotFoundError('Master Kit Product not found', 'PRODUCT_NOT_FOUND');
    return true;
  }
};

module.exports = masterKitProductService;
