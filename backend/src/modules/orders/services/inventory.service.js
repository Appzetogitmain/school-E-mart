const Product = require('../../../database/models/Product');
const ProductVariant = require('../../../database/models/ProductVariant');
const { BadRequestError } = require('../../../common/errors');

const inventoryService = {
  async deductStock(items, session = null) {
    const opts = session ? { session } : {};
    for (const item of items) {
      if (item.variantId) {
        const variant = await ProductVariant.findOneAndUpdate(
          { _id: item.variantId, productId: item.productId, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, ...opts }
        );
        if (!variant) {
          throw new BadRequestError(`Insufficient variant stock for ${item.name}`, null, 'INSUFFICIENT_STOCK');
        }
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
      if (item.variantId) {
        await ProductVariant.findByIdAndUpdate(item.variantId, { $inc: { stock: item.quantity } }, opts);
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
