const ProductVariant = require('../../../database/models/ProductVariant');
const { BaseRepository } = require('../../../repositories');

class VariantRepository extends BaseRepository {
  constructor() {
    super(ProductVariant, { useSoftDelete: false });
  }

  findByProduct(productId) {
    return this.findMany({ productId });
  }

  findBySku(sku) {
    return this.findOne({ sku });
  }
}

module.exports = new VariantRepository();
