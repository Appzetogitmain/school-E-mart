const express = require('express');
const ordersController = require('../controllers/orders.controller');
const validators = require('../validators/orders.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute, optionalAuthRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ROLES } = require('../../../constants/roles');

const router = express.Router();

const orderRead = protectedRoute({
  roles: [ROLES.PARENT, ROLES.USER, ROLES.SCHOOL_ADMIN, ROLES.SUPER_ADMIN, ROLES.TEACHER, ROLES.VENDOR],
});

const customerWrite = protectedRoute({
  roles: [ROLES.PARENT, ROLES.USER, ROLES.SCHOOL_ADMIN, ROLES.TEACHER],
});

const adminOrders = protectedRoute({
  roles: [ROLES.SUPER_ADMIN],
  permissions: [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_WRITE],
  scopes: ['*'],
});

// Checkout
router.post(
  '/checkout/validate',
  ...customerWrite,
  validateQuery(validators.audienceQuery),
  validateBody(validators.checkoutSummarySchema),
  ordersController.validateCheckout
);
router.post(
  '/checkout/summary',
  ...orderRead,
  validateQuery(validators.audienceQuery),
  validateBody(validators.checkoutSummarySchema),
  ordersController.getCheckoutSummary
);

// Returns (customer) — before /:orderId
router.get('/returns/list', ...orderRead, validateQuery(validators.paginationQuery), ordersController.listReturns);
router.get(
  '/returns/:returnId',
  ...orderRead,
  validateParams(validators.returnIdParam),
  ordersController.getReturn
);

// Public tracking
router.get(
  '/track/:orderNumber',
  ...optionalAuthRoute(),
  validateParams(validators.orderNumberParam),
  ordersController.trackOrder
);

// Orders
router.post('/', ...customerWrite, validateBody(validators.createOrderSchema), ordersController.createOrder);
router.get('/', ...orderRead, validateQuery(validators.paginationQuery), ordersController.listOrders);

router.get('/:orderId', ...orderRead, validateParams(validators.orderIdParam), ordersController.getOrder);
router.get(
  '/:orderId/timeline',
  ...orderRead,
  validateParams(validators.orderIdParam),
  ordersController.getOrderTimeline
);
router.post(
  '/:orderId/cancel',
  ...customerWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.cancelOrderSchema),
  ordersController.cancelOrder
);
router.post(
  '/:orderId/payment/confirm',
  ...customerWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.confirmPaymentSchema),
  ordersController.confirmPayment
);
router.patch(
  '/:orderId/status',
  ...adminOrders,
  validateParams(validators.orderIdParam),
  validateBody(validators.statusUpdateSchema),
  ordersController.updateOrderStatus
);

// Refunds
router.post(
  '/:orderId/refunds',
  ...customerWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.refundRequestSchema),
  ordersController.requestRefund
);
router.get(
  '/:orderId/refunds',
  ...orderRead,
  validateParams(validators.orderIdParam),
  ordersController.listRefunds
);
router.post(
  '/:orderId/refunds/:refundId/approve',
  ...adminOrders,
  validateParams(validators.refundIdParam),
  ordersController.approveRefund
);
router.post(
  '/:orderId/refunds/:refundId/reject',
  ...adminOrders,
  validateParams(validators.refundIdParam),
  validateBody(validators.refundActionSchema),
  ordersController.rejectRefund
);

router.post(
  '/:orderId/returns',
  ...customerWrite,
  validateParams(validators.orderIdParam),
  validateBody(validators.createReturnSchema),
  ordersController.createReturn
);

// Delivery
router.get(
  '/:orderId/shipments',
  ...orderRead,
  validateParams(validators.orderIdParam),
  ordersController.listShipments
);
router.post(
  '/:orderId/shipments',
  ...adminOrders,
  validateParams(validators.orderIdParam),
  validateBody(validators.assignShipmentSchema),
  ordersController.assignShipment
);
router.patch(
  '/:orderId/shipments/:shipmentId',
  ...adminOrders,
  validateParams(validators.shipmentIdParam),
  validateBody(validators.updateShipmentSchema),
  ordersController.updateShipment
);
router.get(
  '/:orderId/shipments/:shipmentId/tracking',
  ...orderRead,
  validateParams(validators.shipmentIdParam),
  ordersController.getTracking
);

// Invoices
router.get(
  '/:orderId/invoice',
  ...orderRead,
  validateParams(validators.orderIdParam),
  ordersController.getInvoice
);
router.post(
  '/:orderId/invoice/generate',
  ...orderRead,
  validateParams(validators.orderIdParam),
  ordersController.generateInvoice
);

module.exports = router;
