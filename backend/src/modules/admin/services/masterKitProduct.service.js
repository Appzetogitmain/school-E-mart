const MasterKitProduct = require('../../../database/models/MasterKitProduct');
const { NotFoundError } = require('../../../common/errors');
const { executePaginatedQuery } = require('../../../repositories/query');
const { saveBase64File } = require('../../../utils/fileStorage');

// Every product image must end up as a file under UPLOADS_DIR — never a
// third-party URL or a raw base64 string sitting in the DB (the admin form
// has a fallback that can hand this a data: URI directly, and previously
// also a free-text "paste any URL" field). saveBase64File() passes an
// already-local /uploads/... path through untouched, decodes a data: URI to
// a real file, and returns null for anything else — which this then drops
// instead of persisting.
const normalizeImagePayload = (payload) => {
  if (!payload || !payload.imageUrl) return payload;
  const saved = saveBase64File(payload.imageUrl, 'kit-product');
  if (saved) {
    payload.imageUrl = saved;
  } else {
    delete payload.imageUrl;
  }
  return payload;
};

const masterKitProductService = {
  async createProduct(payload) {
    return MasterKitProduct.create(normalizeImagePayload({ ...payload }));
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
      { $set: normalizeImagePayload({ ...payload }) },
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
