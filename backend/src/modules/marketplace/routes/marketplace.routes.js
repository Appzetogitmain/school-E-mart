const express = require('express');
const marketplaceController = require('../controllers/marketplace.controller');
const validators = require('../validators/marketplace.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ROLES } = require('../../../constants/roles');

const router = express.Router();

const adminCatalog = protectedRoute({
  roles: [ROLES.SUPER_ADMIN],
  scopes: ['*'],
});
const vendorWrite = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.VENDOR],
  permissions: [PERMISSIONS.CATALOG_WRITE],
});
const customerAuth = protectedRoute({
  roles: [ROLES.PARENT, ROLES.SCHOOL_ADMIN],
  permissions: [PERMISSIONS.CATALOG_READ],
});

router.get('/header-categories', validateQuery(validators.paginationQuery), marketplaceController.listHeaderCategories);
router.get('/categories/tree', marketplaceController.getCategoryTree);
router.get('/categories', validateQuery(validators.paginationQuery), marketplaceController.listCategories);
router.get('/subcategories', validateQuery(validators.paginationQuery), marketplaceController.listSubcategories);

router.post(
  '/header-categories',
  ...adminCatalog,
  validateBody(validators.headerCategorySchema),
  marketplaceController.createHeaderCategory
);
router.patch(
  '/header-categories/reorder',
  ...adminCatalog,
  validateBody(validators.reorderSchema),
  marketplaceController.reorderHeaderCategories
);
router.patch(
  '/header-categories/:id',
  ...adminCatalog,
  validateParams(validators.idParam),
  validateBody(validators.updateHeaderCategorySchema),
  marketplaceController.updateHeaderCategory
);
router.delete(
  '/header-categories/:id',
  ...adminCatalog,
  validateParams(validators.idParam),
  marketplaceController.deleteHeaderCategory
);

router.post('/categories', ...adminCatalog, validateBody(validators.categorySchema), marketplaceController.createCategory);
router.patch(
  '/categories/reorder',
  ...adminCatalog,
  validateBody(validators.reorderSchema),
  marketplaceController.reorderCategories
);
router.patch(
  '/categories/:id',
  ...adminCatalog,
  validateParams(validators.idParam),
  validateBody(validators.updateCategorySchema),
  marketplaceController.updateCategory
);
router.delete(
  '/categories/:id',
  ...adminCatalog,
  validateParams(validators.idParam),
  marketplaceController.deleteCategory
);

router.post(
  '/subcategories',
  ...adminCatalog,
  validateBody(validators.subcategorySchema),
  marketplaceController.createSubcategory
);
router.patch(
  '/subcategories/reorder',
  ...adminCatalog,
  validateBody(validators.reorderSchema),
  marketplaceController.reorderSubcategories
);
router.patch(
  '/subcategories/:id',
  ...adminCatalog,
  validateParams(validators.idParam),
  validateBody(validators.updateSubcategorySchema),
  marketplaceController.updateSubcategory
);
router.delete(
  '/subcategories/:id',
  ...adminCatalog,
  validateParams(validators.idParam),
  marketplaceController.deleteSubcategory
);

router.get('/products', validateQuery(validators.paginationQuery), marketplaceController.listProducts);
router.get('/products/featured', validateQuery(validators.paginationQuery), marketplaceController.listFeaturedProducts);
router.get('/products/offers', validateQuery(validators.paginationQuery), marketplaceController.listOfferProducts);
router.get('/products/:productId', validateParams(validators.productIdParam), marketplaceController.getProduct);
router.get(
  '/products/:productId/related',
  validateParams(validators.productIdParam),
  marketplaceController.getRelatedProducts
);
router.get(
  '/products/:productId/similar',
  validateParams(validators.productIdParam),
  marketplaceController.getSimilarProducts
);
router.get(
  '/products/:productId/reviews',
  validateParams(validators.productIdParam),
  validateQuery(validators.paginationQuery),
  marketplaceController.listReviews
);
router.get(
  '/products/:productId/ratings',
  validateParams(validators.productIdParam),
  marketplaceController.getProductRatings
);

router.post('/products', ...vendorWrite, validateBody(validators.createProductSchema), marketplaceController.createProduct);
router.patch(
  '/products/:productId',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.updateProductSchema),
  marketplaceController.updateProduct
);
router.delete(
  '/products/:productId',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  marketplaceController.deleteProduct
);
router.patch(
  '/products/:productId/publish-status',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.publishStatusSchema),
  marketplaceController.setProductPublishStatus
);
router.patch(
  '/products/:productId/approval-status',
  ...adminCatalog,
  validateParams(validators.productIdParam),
  validateBody(validators.approvalStatusSchema),
  marketplaceController.setProductApprovalStatus
);
router.get(
  '/products/:productId/inventory',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  marketplaceController.getProductInventory
);
router.patch(
  '/products/:productId/inventory',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.inventorySchema),
  marketplaceController.updateProductInventory
);

router.get(
  '/products/:productId/variants',
  validateParams(validators.productIdParam),
  marketplaceController.listVariants
);
router.post(
  '/products/:productId/variants',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.createVariantSchema),
  marketplaceController.createVariant
);
router.patch(
  '/products/:productId/variants/:variantId',
  ...vendorWrite,
  validateParams(validators.variantIdParam),
  validateBody(validators.updateVariantSchema),
  marketplaceController.updateVariant
);
router.delete(
  '/products/:productId/variants/:variantId',
  ...vendorWrite,
  validateParams(validators.variantIdParam),
  marketplaceController.deleteVariant
);
router.patch(
  '/products/:productId/variants/:variantId/inventory',
  ...vendorWrite,
  validateParams(validators.variantIdParam),
  validateBody(validators.variantInventorySchema),
  marketplaceController.updateVariantInventory
);

router.get('/recently-viewed', ...customerAuth, validateQuery(validators.audienceQuery), marketplaceController.getRecentlyViewed);
router.post(
  '/products/:productId/view',
  ...customerAuth,
  validateParams(validators.productIdParam),
  validateQuery(validators.audienceQuery),
  marketplaceController.recordProductView
);

router.get('/cart', ...customerAuth, validateQuery(validators.audienceQuery), marketplaceController.getCart);
router.get('/cart/summary', ...customerAuth, validateQuery(validators.audienceQuery), marketplaceController.getCartSummary);
router.post(
  '/cart/items',
  ...customerAuth,
  validateQuery(validators.audienceQuery),
  validateBody(validators.cartItemSchema),
  marketplaceController.addCartItem
);
router.patch(
  '/cart/items/:productId',
  ...customerAuth,
  validateQuery(validators.audienceQuery),
  validateParams(validators.cartItemParam),
  validateBody(validators.updateCartQuantitySchema),
  marketplaceController.updateCartItem
);
router.delete(
  '/cart/items/:productId',
  ...customerAuth,
  validateQuery(validators.audienceQuery),
  validateParams(validators.cartItemParam),
  marketplaceController.removeCartItem
);
router.delete('/cart', ...customerAuth, validateQuery(validators.audienceQuery), marketplaceController.clearCart);

router.get('/wishlist', ...customerAuth, validateQuery(validators.audienceQuery), marketplaceController.getWishlist);
router.post(
  '/wishlist/items',
  ...customerAuth,
  validateQuery(validators.audienceQuery),
  validateBody(validators.wishlistItemSchema),
  marketplaceController.addWishlistItem
);
router.delete(
  '/wishlist/items/:productId',
  ...customerAuth,
  validateQuery(validators.audienceQuery),
  validateParams(validators.productIdParam),
  marketplaceController.removeWishlistItem
);

router.post(
  '/products/:productId/reviews',
  ...customerAuth,
  validateParams(validators.productIdParam),
  validateBody(validators.reviewSchema),
  marketplaceController.createReview
);
router.patch(
  '/products/:productId/reviews/:reviewId',
  ...customerAuth,
  validateParams(validators.reviewIdParam),
  validateBody(validators.reviewSchema.fork(['rating'], (s) => s.optional())),
  marketplaceController.updateReview
);
router.delete(
  '/products/:productId/reviews/:reviewId',
  ...customerAuth,
  validateParams(validators.reviewIdParam),
  marketplaceController.deleteReview
);

module.exports = router;
