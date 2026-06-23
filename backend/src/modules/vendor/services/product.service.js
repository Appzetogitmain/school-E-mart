const { NotFoundError } = require('../../../common/errors');
const productService = require('../../marketplace/services/product.service');
const productRepository = require('../../marketplace/repositories/product.repository');
const vendorAccessPolicy = require('../policies/vendorAccess.policy');
const { resolveSort } = require('../../marketplace/services/search.service');

const vendorProductService = {
  listProducts(vendorId, query) {
    const filter = { vendorId };
    if (query.approval) filter.approvalStatus = query.approval;
    if (query.publishStatus) filter.publishStatus = query.publishStatus;
    if (query.search || query.q) {
      return productRepository.paginateProducts(filter, {
        ...query,
        q: query.search || query.q,
      });
    }
    return productRepository.paginateProducts(filter, query, {
      defaultSort: resolveSort(query.sort),
    });
  },

  async getProduct(vendorId, productId) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);
    return {
      ...product,
      inventory: productService.getInventoryStatus(product),
      offer: productService.getOfferDisplay(product),
    };
  },

  async createProduct(vendorId, payload) {
    return productService.createProduct(vendorId, payload);
  },

  async updateProduct(vendorId, productId, payload) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);
    return productService.updateProduct(productId, payload);
  },

  async deleteProduct(vendorId, productId, deletedBy) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);
    return productService.deleteProduct(productId, deletedBy);
  },

  async setPublishStatus(vendorId, productId, publishStatus) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);
    return productService.setPublishStatus(productId, publishStatus);
  },

  async setVisibility(vendorId, productId, { publishStatus, approvalStatus }) {
    const product = await productService.getProduct(productId);
    vendorAccessPolicy.assertProductOwnership(vendorId, product);
    const update = {};
    if (publishStatus) update.publishStatus = publishStatus;
    if (approvalStatus) update.approvalStatus = approvalStatus;
    return productService.updateProduct(productId, update);
  },
};

module.exports = vendorProductService;
