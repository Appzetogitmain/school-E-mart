const { NotFoundError, ConflictError } = require('../../../common/errors');
const wishlistRepository = require('../repositories/wishlist.repository');
const productRepository = require('../repositories/product.repository');

const wishlistService = {
  async getOrCreateWishlist(userId, audience) {
    let wishlist = await wishlistRepository.findByUser(userId, audience);
    if (!wishlist) {
      wishlist = await wishlistRepository.upsertWishlist(userId, audience, []);
    }
    return wishlist;
  },

  async addItem(userId, audience, productId) {
    const product = await productRepository.findOne(
      productRepository.findPublishedFilter({ _id: productId })
    );
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');

    const wishlist = await this.getOrCreateWishlist(userId, audience);
    const exists = (wishlist.items || []).some((item) => String(item.productId) === String(productId));
    if (exists) throw new ConflictError('Product already in wishlist', 'WISHLIST_DUPLICATE');

    const items = [...(wishlist.items || []), { productId, addedAt: new Date() }];
    return wishlistRepository.upsertWishlist(userId, audience, items);
  },

  async removeItem(userId, audience, productId) {
    const wishlist = await this.getOrCreateWishlist(userId, audience);
    const items = (wishlist.items || []).filter((item) => String(item.productId) !== String(productId));
    return wishlistRepository.upsertWishlist(userId, audience, items);
  },

  async listWishlist(userId, audience) {
    const wishlist = await this.getOrCreateWishlist(userId, audience);
    const productIds = (wishlist.items || []).map((item) => item.productId);
    if (!productIds.length) return { wishlist, products: [] };

    const products = await productRepository.findMany(
      productRepository.mergeFilter(productRepository.findPublishedFilter({ _id: { $in: productIds } }))
    );
    return { wishlist, products };
  },
};

module.exports = wishlistService;
