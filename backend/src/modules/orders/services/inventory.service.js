const Product = require('../../../database/models/Product');
const ProductVariant = require('../../../database/models/ProductVariant');
const Kit = require('../../../database/models/Kit');
const { BadRequestError } = require('../../../common/errors');

// The product's own stock is the TOTAL of its variants, so it is re-derived after a variant is sold or restored
const refreshProductFromVariants = (productId, session) =>
  require('../../marketplace/services/product.service').refreshFromVariants(productId, { session });

const inventoryService = {
  async deductStock(items, session = null) {
    const opts = session ? { session } : {};
    for (const item of items) {
      if (item.kitId) continue;
      const isKit = await Kit.exists({ _id: item.productId });
      if (isKit) continue;

      if (item.variantId) {
        const variant = await ProductVariant.findOneAndUpdate(
          { _id: item.variantId, productId: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, ...opts }
        );
        if (!variant) {
          throw new BadRequestError(`Insufficient variant stock for ${item.name}`, null, 'INSUFFICIENT_STOCK');
        }
        await refreshProductFromVariants(item.productId, session);
        await Product.updateOne({ _id: item.productId }, { $inc: { salesCount: item.quantity } }, opts);
      } else {
        const product = await Product.findOneAndUpdate(
          { _id: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity, salesCount: item.quantity } },
          { new: true, ...opts }
        );
        if (!product) {
          throw new BadRequestError(`Insufficient stock for ${item.name}`, null, 'INSUFFICIENT_STOCK');
        }
      }
    }
  },

  async restoreStock(items, session = null) {
    const opts = session ? { session } : {};
    for (const item of items) {
      if (item.kitId) continue;
      const isKit = await Kit.exists({ _id: item.productId });
      if (isKit) continue;

      if (item.variantId) {
        await ProductVariant.findByIdAndUpdate(item.variantId, { $inc: { stock: item.quantity } }, opts);
        await refreshProductFromVariants(item.productId, session);
        await Product.updateOne({ _id: item.productId }, { $inc: { salesCount: -item.quantity } }, opts);
      } else {
        await Product.findByIdAndUpdate(
          item.productId,
          { $inc: { stock: item.quantity, salesCount: -item.quantity } },
          opts
        );
      }
    }
  },
};

module.exports = inventoryService;
