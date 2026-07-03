const express = require('express');
const vendorController = require('../controllers/vendor.controller');
const validators = require('../validators/vendor.validator');
const rfqValidators = require('../../rfq/validators/rfq.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ROLES } = require('../../../constants/roles');
const { authLimiter } = require('../../../middlewares/rateLimit');

const router = express.Router();

const vendorProfile = protectedRoute({
  roles: [ROLES.VENDOR],
});

const vendorApproved = protectedRoute({
  roles: [ROLES.VENDOR],
  permissions: [PERMISSIONS.CATALOG_READ],
});

const vendorWrite = protectedRoute({
  roles: [ROLES.VENDOR],
  permissions: [PERMISSIONS.CATALOG_WRITE],
});

const vendorOrders = protectedRoute({
  roles: [ROLES.VENDOR],
  permissions: [PERMISSIONS.ORDERS_READ],
});

const vendorOrdersWrite = protectedRoute({
  roles: [ROLES.VENDOR],
  permissions: [PERMISSIONS.ORDERS_WRITE],
});

const vendorAdmin = protectedRoute({
  roles: [ROLES.SUPER_ADMIN],
  permissions: [PERMISSIONS.VENDOR_MANAGE],
  scopes: ['*'],
});

// Registration (public)
router.post(
  '/register',
  authLimiter,
  validateBody(validators.registerSchema),
  vendorController.register
);

// Profile & onboarding (pending vendors allowed)
router.get('/me/profile', ...vendorProfile, vendorController.getProfile);
router.put('/me/profile', ...vendorProfile, validateBody(validators.updateProfileSchema), vendorController.updateProfile);
router.patch(
  '/me/business',
  ...vendorProfile,
  validateBody(validators.businessInfoSchema),
  vendorController.updateBusinessInfo
);
router.patch('/me/tax', ...vendorProfile, validateBody(validators.taxInfoSchema), vendorController.updateTaxInfo);
router.patch(
  '/me/bank',
  ...vendorProfile,
  validateBody(validators.bankDetailsSchema),
  vendorController.updateBankDetails
);
router.patch('/me/address', ...vendorProfile, validateBody(validators.addressSchema), vendorController.updateAddress);
router.post('/me/documents', ...vendorProfile, validateBody(validators.documentSchema), vendorController.addDocument);
router.get('/me/status', ...vendorProfile, vendorController.getStatus);

// Products
router.get('/products', ...vendorApproved, validateQuery(validators.paginationQuery), vendorController.listProducts);
router.post('/products', ...vendorWrite, validateBody(validators.createProductSchema), vendorController.createProduct);
router.get(
  '/products/:productId',
  ...vendorApproved,
  validateParams(validators.productIdParam),
  vendorController.getProduct
);
router.patch(
  '/products/:productId',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.updateProductSchema),
  vendorController.updateProduct
);
router.delete(
  '/products/:productId',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  vendorController.deleteProduct
);
router.patch(
  '/products/:productId/publish',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.publishStatusSchema),
  vendorController.setPublishStatus
);
router.patch(
  '/products/:productId/visibility',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.visibilitySchema),
  vendorController.setVisibility
);

// Inventory
router.get(
  '/inventory/low-stock',
  ...vendorApproved,
  validateQuery(validators.paginationQuery),
  vendorController.listLowStock
);
router.get(
  '/products/:productId/inventory',
  ...vendorApproved,
  validateParams(validators.productIdParam),
  vendorController.getInventory
);
router.patch(
  '/products/:productId/inventory',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.inventoryUpdateSchema),
  vendorController.updateInventory
);
router.post(
  '/products/:productId/inventory/adjust',
  ...vendorWrite,
  validateParams(validators.productIdParam),
  validateBody(validators.inventoryAdjustSchema),
  vendorController.adjustInventory
);
router.get(
  '/products/:productId/inventory/history',
  ...vendorApproved,
  validateParams(validators.productIdParam),
  validateQuery(validators.paginationQuery),
  vendorController.getInventoryHistory
);
router.get(
  '/products/:productId/availability',
  ...vendorApproved,
  validateParams(validators.productIdParam),
  vendorController.checkAvailability
);

// Orders
router.get('/orders', ...vendorOrders, validateQuery(validators.paginationQuery), vendorController.listOrders);
router.get(
  '/orders/history',
  ...vendorOrders,
  validateQuery(validators.paginationQuery),
  vendorController.getOrderHistory
);
router.get(
  '/orders/:orderId',
  ...vendorOrders,
  validateParams(validators.orderIdParam),
  vendorController.getOrder
);
router.patch(
  '/orders/:orderId/status',
  ...vendorOrdersWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.orderStatusSchema),
  vendorController.updateOrderStatus
);
router.post(
  '/orders/:orderId/accept',
  ...vendorOrdersWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.orderActionSchema),
  vendorController.acceptOrder
);
router.post(
  '/orders/:orderId/reject',
  ...vendorOrdersWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.orderActionSchema),
  vendorController.rejectOrder
);
router.post(
  '/orders/:orderId/process',
  ...vendorOrdersWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.orderActionSchema),
  vendorController.processOrder
);
router.post(
  '/orders/:orderId/ready-for-dispatch',
  ...vendorOrdersWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.orderActionSchema),
  vendorController.markReadyForDispatch
);

// Returns
router.get('/returns', ...vendorOrders, validateQuery(validators.paginationQuery), vendorController.listReturns);
router.get(
  '/returns/history',
  ...vendorOrders,
  validateQuery(validators.paginationQuery),
  vendorController.getReturnHistory
);
router.get(
  '/returns/:returnId',
  ...vendorOrders,
  validateParams(validators.returnIdParam),
  vendorController.getReturn
);
router.patch(
  '/returns/:returnId/status',
  ...vendorOrdersWrite,
  validateParams(validators.returnIdParam),
  validateBody(validators.returnStatusSchema),
  vendorController.updateReturnStatus
);
router.post(
  '/returns/:returnId/approve',
  ...vendorOrdersWrite,
  validateParams(validators.returnIdParam),
  validateBody(validators.returnActionSchema),
  vendorController.approveReturn
);
router.post(
  '/returns/:returnId/reject',
  ...vendorOrdersWrite,
  validateParams(validators.returnIdParam),
  validateBody(validators.returnActionSchema),
  vendorController.rejectReturn
);

// Settlements
router.get('/settlements/earnings', ...vendorOrders, vendorController.getEarningsSummary);
router.get(
  '/settlements',
  ...vendorOrders,
  validateQuery(validators.paginationQuery),
  vendorController.listSettlements
);
router.get(
  '/settlements/pending',
  ...vendorOrders,
  validateQuery(validators.paginationQuery),
  vendorController.listPendingSettlements
);
router.get(
  '/settlements/history',
  ...vendorOrders,
  validateQuery(validators.paginationQuery),
  vendorController.getSettlementHistory
);

// Analytics
router.get('/analytics/dashboard', ...vendorApproved, vendorController.getDashboard);
router.get(
  '/analytics/revenue',
  ...vendorApproved,
  validateQuery(validators.paginationQuery),
  vendorController.getRevenueSummary
);

// RFQ / Quotations
router.get('/rfqs', ...vendorApproved, validateQuery(rfqValidators.paginationQuery), vendorController.listRfqs);
router.get(
  '/rfqs/:rfqId',
  ...vendorApproved,
  validateParams(rfqValidators.rfqIdParam),
  vendorController.getRfq
);
router.post(
  '/rfqs/:rfqId/quotes',
  ...vendorApproved,
  validateParams(rfqValidators.rfqIdParam),
  validateBody(rfqValidators.submitQuoteSchema),
  vendorController.submitQuote
);

// Admin verification
router.get(
  '/admin/vendors',
  ...vendorAdmin,
  validateQuery(validators.paginationQuery),
  vendorController.listVendorsAdmin
);
router.get(
  '/admin/vendors/:vendorId',
  ...vendorAdmin,
  validateParams(validators.vendorIdParam),
  vendorController.getVendorAdmin
);
router.post(
  '/admin/vendors/:vendorId/approve',
  ...vendorAdmin,
  validateParams(validators.vendorIdParam),
  validateBody(validators.verificationActionSchema),
  vendorController.approveVendor
);
router.post(
  '/admin/vendors/:vendorId/reject',
  ...vendorAdmin,
  validateParams(validators.vendorIdParam),
  validateBody(validators.verificationActionSchema),
  vendorController.rejectVendor
);
router.post(
  '/admin/vendors/:vendorId/suspend',
  ...vendorAdmin,
  validateParams(validators.vendorIdParam),
  validateBody(validators.verificationActionSchema),
  vendorController.suspendVendor
);
router.post(
  '/admin/vendors/:vendorId/reverify',
  ...vendorAdmin,
  validateParams(validators.vendorIdParam),
  validateBody(validators.verificationActionSchema),
  vendorController.reverifyVendor
);

module.exports = router;
