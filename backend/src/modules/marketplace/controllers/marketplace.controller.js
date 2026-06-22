const { success, created, paginated } = require('../../../common/response');
const asyncHandler = require('../../../utils/asyncHandler');
const taxonomyService = require('../services/taxonomy.service');
const productService = require('../services/product.service');
const cartService = require('../services/cart.service');
const wishlistService = require('../services/wishlist.service');
const reviewService = require('../services/review.service');
const recommendationService = require('../services/recommendation.service');
const marketplaceAccessPolicy = require('../policies/marketplaceAccess.policy');

const marketplaceController = {
  listHeaderCategories: asyncHandler(async (req, res) => {
    const { data, pagination } = await taxonomyService.listHeaderCategories(req.query);
    return paginated(res, { headerCategories: data }, pagination, 'Header categories fetched', req);
  }),

  createHeaderCategory: asyncHandler(async (req, res) => {
    const headerCategory = await taxonomyService.createHeaderCategory(req.body);
    return created(res, { headerCategory }, 'Header category created', req);
  }),

  updateHeaderCategory: asyncHandler(async (req, res) => {
    const headerCategory = await taxonomyService.updateHeaderCategory(req.params.id, req.body);
    return success(res, { headerCategory }, 'Header category updated', undefined, req);
  }),

  deleteHeaderCategory: asyncHandler(async (req, res) => {
    await taxonomyService.deleteHeaderCategory(req.params.id, req.auth.userId);
    return success(res, null, 'Header category deleted', undefined, req);
  }),

  reorderHeaderCategories: asyncHandler(async (req, res) => {
    const headerCategories = await taxonomyService.reorderHeaderCategories(req.body.orderedIds);
    return success(res, { headerCategories }, 'Header categories reordered', undefined, req);
  }),

  getCategoryTree: asyncHandler(async (req, res) => {
    const tree = await taxonomyService.getCategoryTree(req.query.status || 'active');
    return success(res, { tree }, 'Category tree fetched', undefined, req);
  }),

  listCategories: asyncHandler(async (req, res) => {
    const { data, pagination } = await taxonomyService.listCategories(req.query);
    return paginated(res, { categories: data }, pagination, 'Categories fetched', req);
  }),

  createCategory: asyncHandler(async (req, res) => {
    const category = await taxonomyService.createCategory(req.body);
    return created(res, { category }, 'Category created', req);
  }),

  updateCategory: asyncHandler(async (req, res) => {
    const category = await taxonomyService.updateCategory(req.params.id, req.body);
    return success(res, { category }, 'Category updated', undefined, req);
  }),

  deleteCategory: asyncHandler(async (req, res) => {
    await taxonomyService.deleteCategory(req.params.id, req.auth.userId);
    return success(res, null, 'Category deleted', undefined, req);
  }),

  reorderCategories: asyncHandler(async (req, res) => {
    const categories = await taxonomyService.reorderCategories(req.body.headerId, req.body.orderedIds);
    return success(res, { categories }, 'Categories reordered', undefined, req);
  }),

  listSubcategories: asyncHandler(async (req, res) => {
    const { data, pagination } = await taxonomyService.listSubcategories(req.query);
    return paginated(res, { subcategories: data }, pagination, 'Subcategories fetched', req);
  }),

  createSubcategory: asyncHandler(async (req, res) => {
    const subcategory = await taxonomyService.createSubcategory(req.body);
    return created(res, { subcategory }, 'Subcategory created', req);
  }),

  updateSubcategory: asyncHandler(async (req, res) => {
    const subcategory = await taxonomyService.updateSubcategory(req.params.id, req.body);
    return success(res, { subcategory }, 'Subcategory updated', undefined, req);
  }),

  deleteSubcategory: asyncHandler(async (req, res) => {
    await taxonomyService.deleteSubcategory(req.params.id, req.auth.userId);
    return success(res, null, 'Subcategory deleted', undefined, req);
  }),

  reorderSubcategories: asyncHandler(async (req, res) => {
    const subcategories = await taxonomyService.reorderSubcategories(req.body.categoryId, req.body.orderedIds);
    return success(res, { subcategories }, 'Subcategories reordered', undefined, req);
  }),

  listProducts: asyncHandler(async (req, res) => {
    const { data, pagination } = await productService.listProducts(req.query, { publicOnly: true });
    const products = data.map((product) => ({
      ...product,
      offer: productService.getOfferDisplay(product),
      inventory: productService.getInventoryStatus(product),
    }));
    return paginated(res, { products }, pagination, 'Products fetched', req);
  }),

  listFeaturedProducts: asyncHandler(async (req, res) => {
    const { data, pagination } = await productService.listFeatured(req.query);
    return paginated(res, { products: data }, pagination, 'Featured products fetched', req);
  }),

  listOfferProducts: asyncHandler(async (req, res) => {
    const { data, pagination } = await productService.listOffers(req.query);
    const products = data.map((product) => ({
      ...product,
      offer: productService.getOfferDisplay(product),
    }));
    return paginated(res, { products }, pagination, 'Offer products fetched', req);
  }),

  getProduct: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId, { publicOnly: true });
    if (req.auth?.userId) {
      const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
      await recommendationService.recordProductView(req.auth.userId, audience, product._id);
    }
    return success(
      res,
      {
        product,
        offer: productService.getOfferDisplay(product),
        inventory: productService.getInventoryStatus(product),
      },
      'Product fetched',
      undefined,
      req
    );
  }),

  createProduct: asyncHandler(async (req, res) => {
    let vendorId;
    if (marketplaceAccessPolicy.isCatalogAdmin(req.auth)) {
      if (!req.body.vendorId) {
        const { BadRequestError } = require('../../../common/errors');
        throw new BadRequestError('vendorId is required for admin product creation', 'VENDOR_ID_REQUIRED');
      }
      vendorId = req.body.vendorId;
    } else {
      vendorId = await marketplaceAccessPolicy.resolveVendorId(req.auth);
    }
    const product = await productService.createProduct(vendorId, req.body);
    return created(res, { product }, 'Product created', req);
  }),

  updateProduct: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    await marketplaceAccessPolicy.assertProductOwnership(req.auth, product);
    const updated = await productService.updateProduct(req.params.productId, req.body);
    return success(res, { product: updated }, 'Product updated', undefined, req);
  }),

  deleteProduct: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    await marketplaceAccessPolicy.assertProductOwnership(req.auth, product);
    await productService.deleteProduct(req.params.productId, req.auth.userId);
    return success(res, null, 'Product deleted', undefined, req);
  }),

  setProductPublishStatus: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    await marketplaceAccessPolicy.assertProductOwnership(req.auth, product);
    const updated = await productService.setPublishStatus(req.params.productId, req.body.publishStatus);
    return success(res, { product: updated }, 'Publish status updated', undefined, req);
  }),

  setProductApprovalStatus: asyncHandler(async (req, res) => {
    const updated = await productService.setApprovalStatus(req.params.productId, req.body.approvalStatus);
    return success(res, { product: updated }, 'Approval status updated', undefined, req);
  }),

  getProductInventory: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    return success(res, { inventory: productService.getInventoryStatus(product) }, 'Inventory fetched', undefined, req);
  }),

  updateProductInventory: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    await marketplaceAccessPolicy.assertProductOwnership(req.auth, product);
    const result = await productService.updateInventory(req.params.productId, req.body);
    return success(res, result, 'Inventory updated', undefined, req);
  }),

  listVariants: asyncHandler(async (req, res) => {
    const variants = await productService.listVariants(req.params.productId);
    return success(res, { variants }, 'Variants fetched', undefined, req);
  }),

  createVariant: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    await marketplaceAccessPolicy.assertProductOwnership(req.auth, product);
    const variant = await productService.addVariant(req.params.productId, req.body);
    return created(res, { variant }, 'Variant created', req);
  }),

  updateVariant: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    await marketplaceAccessPolicy.assertProductOwnership(req.auth, product);
    const variant = await productService.updateVariant(req.params.productId, req.params.variantId, req.body);
    return success(res, { variant }, 'Variant updated', undefined, req);
  }),

  deleteVariant: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    await marketplaceAccessPolicy.assertProductOwnership(req.auth, product);
    await productService.deleteVariant(req.params.productId, req.params.variantId);
    return success(res, null, 'Variant deleted', undefined, req);
  }),

  updateVariantInventory: asyncHandler(async (req, res) => {
    const product = await productService.getProduct(req.params.productId);
    await marketplaceAccessPolicy.assertProductOwnership(req.auth, product);
    const result = await productService.updateVariantInventory(
      req.params.productId,
      req.params.variantId,
      req.body.stock
    );
    return success(res, result, 'Variant inventory updated', undefined, req);
  }),

  getRelatedProducts: asyncHandler(async (req, res) => {
    const products = await recommendationService.getRelatedProducts(req.params.productId);
    return success(res, { products }, 'Related products fetched', undefined, req);
  }),

  getSimilarProducts: asyncHandler(async (req, res) => {
    const products = await recommendationService.getSimilarProducts(req.params.productId);
    return success(res, { products }, 'Similar products fetched', undefined, req);
  }),

  getRecentlyViewed: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    const products = await recommendationService.getRecentlyViewed(req.auth.userId, audience);
    return success(res, { products }, 'Recently viewed products fetched', undefined, req);
  }),

  recordProductView: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    await recommendationService.recordProductView(req.auth.userId, audience, req.params.productId);
    return success(res, null, 'Product view recorded', undefined, req);
  }),

  getCart: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    marketplaceAccessPolicy.assertCartAudience(req.auth, audience);
    const cart = await cartService.getOrCreateCart(req.auth.userId, audience);
    return success(res, { cart }, 'Cart fetched', undefined, req);
  }),

  getCartSummary: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    marketplaceAccessPolicy.assertCartAudience(req.auth, audience);
    const cart = await cartService.getCartSummary(req.auth.userId, audience);
    return success(res, { cart }, 'Cart summary fetched', undefined, req);
  }),

  addCartItem: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    marketplaceAccessPolicy.assertCartAudience(req.auth, audience);
    const cart = await cartService.addItem(req.auth.userId, audience, req.body);
    return created(res, { cart }, 'Item added to cart', req);
  }),

  updateCartItem: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    marketplaceAccessPolicy.assertCartAudience(req.auth, audience);
    const cart = await cartService.updateItemQuantity(
      req.auth.userId,
      audience,
      req.params.productId,
      req.params.variantId,
      req.body.quantity
    );
    return success(res, { cart }, 'Cart item updated', undefined, req);
  }),

  removeCartItem: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    marketplaceAccessPolicy.assertCartAudience(req.auth, audience);
    const cart = await cartService.removeItem(
      req.auth.userId,
      audience,
      req.params.productId,
      req.params.variantId
    );
    return success(res, { cart }, 'Cart item removed', undefined, req);
  }),

  clearCart: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    marketplaceAccessPolicy.assertCartAudience(req.auth, audience);
    const cart = await cartService.clearCart(req.auth.userId, audience);
    return success(res, { cart }, 'Cart cleared', undefined, req);
  }),

  getWishlist: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    const result = await wishlistService.listWishlist(req.auth.userId, audience);
    return success(res, result, 'Wishlist fetched', undefined, req);
  }),

  addWishlistItem: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    const wishlist = await wishlistService.addItem(req.auth.userId, audience, req.body.productId);
    return created(res, { wishlist }, 'Wishlist item added', req);
  }),

  removeWishlistItem: asyncHandler(async (req, res) => {
    const audience = marketplaceAccessPolicy.resolveAudience(req.auth, req.query.audience);
    const wishlist = await wishlistService.removeItem(req.auth.userId, audience, req.params.productId);
    return success(res, { wishlist }, 'Wishlist item removed', undefined, req);
  }),

  listReviews: asyncHandler(async (req, res) => {
    const { data, pagination } = await reviewService.listReviews(req.params.productId, req.query);
    return paginated(res, { reviews: data }, pagination, 'Reviews fetched', req);
  }),

  getProductRatings: asyncHandler(async (req, res) => {
    const ratings = await reviewService.getProductRatings(req.params.productId);
    return success(res, { ratings }, 'Product ratings fetched', undefined, req);
  }),

  createReview: asyncHandler(async (req, res) => {
    const review = await reviewService.createReview(req.auth.userId, req.params.productId, req.body);
    return created(res, { review }, 'Review created', req);
  }),

  updateReview: asyncHandler(async (req, res) => {
    const review = await reviewService.updateReview(
      req.auth.userId,
      req.params.productId,
      req.params.reviewId,
      req.body
    );
    return success(res, { review }, 'Review updated', undefined, req);
  }),

  deleteReview: asyncHandler(async (req, res) => {
    await reviewService.deleteReview(req.auth.userId, req.params.productId, req.params.reviewId, req.auth.userId);
    return success(res, null, 'Review deleted', undefined, req);
  }),
};

module.exports = marketplaceController;
