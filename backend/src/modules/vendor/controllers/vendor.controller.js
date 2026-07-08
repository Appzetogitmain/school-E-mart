const { success, created, paginated } = require('../../../common/response');
const asyncHandler = require('../../../utils/asyncHandler');
const registrationService = require('../services/registration.service');
const profileService = require('../services/profile.service');
const vendorProductService = require('../services/product.service');
const inventoryService = require('../services/inventory.service');
const vendorOrderService = require('../services/order.service');
const vendorReturnService = require('../services/return.service');
const settlementService = require('../services/settlement.service');
const analyticsService = require('../services/analytics.service');
const verificationService = require('../services/verification.service');
const vendorAccessPolicy = require('../policies/vendorAccess.policy');
const productService = require('../../marketplace/services/product.service');
const rfqService = require('../../rfq/services/rfq.service');

const vendorController = {
  register: asyncHandler(async (req, res) => {
    const result = await registrationService.register(req.body, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.requestId,
    });
    return created(res, result, 'Vendor registered successfully. Awaiting approval.', req);
  }),

  getProfile: asyncHandler(async (req, res) => {
    const profile = await profileService.getProfile(req.auth.userId);
    return success(res, { profile }, 'Vendor profile fetched', undefined, req);
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const profile = await profileService.updateProfile(req.auth.userId, req.body);
    return success(res, { profile }, 'Vendor profile updated', undefined, req);
  }),

  updateBusinessInfo: asyncHandler(async (req, res) => {
    const profile = await profileService.updateBusinessInfo(req.auth.userId, req.body);
    return success(res, { profile }, 'Business information updated', undefined, req);
  }),

  updateTaxInfo: asyncHandler(async (req, res) => {
    const profile = await profileService.updateTaxInfo(req.auth.userId, req.body);
    return success(res, { profile }, 'Tax information updated', undefined, req);
  }),

  updateBankDetails: asyncHandler(async (req, res) => {
    const profile = await profileService.updateBankDetails(req.auth.userId, req.body);
    return success(res, { profile }, 'Bank details updated', undefined, req);
  }),

  updateAddress: asyncHandler(async (req, res) => {
    const profile = await profileService.updateAddress(req.auth.userId, req.body);
    return success(res, { profile }, 'Address updated', undefined, req);
  }),

  addDocument: asyncHandler(async (req, res) => {
    const profile = await profileService.addDocument(req.auth.userId, req.body);
    return success(res, { profile }, 'Document added', undefined, req);
  }),

  getStatus: asyncHandler(async (req, res) => {
    const status = await profileService.getStatus(req.auth.userId);
    return success(res, { status }, 'Vendor status fetched', undefined, req);
  }),

  listProducts: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await vendorProductService.listProducts(vendorId, req.query);
    const products = data.map((p) => ({
      ...p,
      inventory: productService.getInventoryStatus(p),
    }));
    return paginated(res, { products }, pagination, 'Products fetched', req);
  }),

  getProduct: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const product = await vendorProductService.getProduct(vendorId, req.params.productId);
    return success(res, { product }, 'Product fetched', undefined, req);
  }),

  createProduct: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const product = await vendorProductService.createProduct(vendorId, req.body);
    return created(res, { product }, 'Product created', req);
  }),

  updateProduct: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const product = await vendorProductService.updateProduct(vendorId, req.params.productId, req.body);
    return success(res, { product }, 'Product updated', undefined, req);
  }),

  deleteProduct: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    await vendorProductService.deleteProduct(vendorId, req.params.productId, req.auth.userId);
    return success(res, null, 'Product deleted', undefined, req);
  }),

  setPublishStatus: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const product = await vendorProductService.setPublishStatus(
      vendorId,
      req.params.productId,
      req.body.publishStatus
    );
    return success(res, { product }, 'Publish status updated', undefined, req);
  }),

  setVisibility: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const product = await vendorProductService.setVisibility(vendorId, req.params.productId, req.body);
    return success(res, { product }, 'Product visibility updated', undefined, req);
  }),

  getInventory: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const inventory = await inventoryService.getInventory(vendorId, req.params.productId);
    return success(res, inventory, 'Inventory fetched', undefined, req);
  }),

  updateInventory: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const result = await inventoryService.updateStock(vendorId, req.params.productId, req.body, req.auth);
    return success(res, result, 'Inventory updated', undefined, req);
  }),

  adjustInventory: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const result = await inventoryService.adjustInventory(
      vendorId,
      req.params.productId,
      req.body,
      req.auth
    );
    return success(res, result, 'Inventory adjusted', undefined, req);
  }),

  listLowStock: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await inventoryService.listLowStock(vendorId, req.query);
    return paginated(res, { products: data }, pagination, 'Low stock products fetched', req);
  }),

  getInventoryHistory: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await inventoryService.getHistory(
      vendorId,
      req.params.productId,
      req.query
    );
    return paginated(res, { history: data }, pagination, 'Inventory history fetched', req);
  }),

  checkAvailability: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const availability = await inventoryService.checkAvailability(vendorId, req.params.productId);
    return success(res, availability, 'Availability checked', undefined, req);
  }),

  listOrders: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await vendorOrderService.listOrders(vendorId, req.query);
    return paginated(res, { orders: data }, pagination, 'Orders fetched', req);
  }),

  getOrder: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const order = await vendorOrderService.getOrder(vendorId, req.params.orderId);
    return success(res, { order }, 'Order fetched', undefined, req);
  }),

  updateOrderStatus: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const order = await vendorOrderService.updateOrderStatus(
      vendorId,
      req.params.orderId,
      req.body,
      req.auth
    );
    return success(res, { order }, 'Order status updated', undefined, req);
  }),

  acceptOrder: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const order = await vendorOrderService.acceptOrder(
      vendorId,
      req.params.orderId,
      req.auth,
      req.body.note
    );
    return success(res, { order }, 'Order accepted', undefined, req);
  }),

  rejectOrder: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const order = await vendorOrderService.rejectOrder(
      vendorId,
      req.params.orderId,
      req.auth,
      req.body.reason
    );
    return success(res, { order }, 'Order rejected', undefined, req);
  }),

  processOrder: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const order = await vendorOrderService.processOrder(
      vendorId,
      req.params.orderId,
      req.auth,
      req.body.note
    );
    return success(res, { order }, 'Order processing started', undefined, req);
  }),

  markReadyForDispatch: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const order = await vendorOrderService.markReadyForDispatch(
      vendorId,
      req.params.orderId,
      req.auth,
      req.body.note
    );
    return success(res, { order }, 'Order ready for dispatch', undefined, req);
  }),

  getOrderHistory: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await vendorOrderService.getOrderHistory(vendorId, req.query);
    return paginated(res, { orders: data }, pagination, 'Order history fetched', req);
  }),

  listReturns: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await vendorReturnService.listReturns(vendorId, req.query);
    return paginated(res, { returns: data }, pagination, 'Returns fetched', req);
  }),

  getReturn: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const returnRequest = await vendorReturnService.getReturn(vendorId, req.params.returnId);
    return success(res, { return: returnRequest }, 'Return fetched', undefined, req);
  }),

  updateReturnStatus: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const returnRequest = await vendorReturnService.updateReturnStatus(
      vendorId,
      req.params.returnId,
      req.body,
      req.auth
    );
    return success(res, { return: returnRequest }, 'Return status updated', undefined, req);
  }),

  approveReturn: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const returnRequest = await vendorReturnService.approveReturn(
      vendorId,
      req.params.returnId,
      req.auth,
      req.body.note
    );
    return success(res, { return: returnRequest }, 'Return approved', undefined, req);
  }),

  rejectReturn: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const returnRequest = await vendorReturnService.rejectReturn(
      vendorId,
      req.params.returnId,
      req.auth,
      req.body.reason
    );
    return success(res, { return: returnRequest }, 'Return rejected', undefined, req);
  }),

  getReturnHistory: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await vendorReturnService.getReturnHistory(vendorId, req.query);
    return paginated(res, { returns: data }, pagination, 'Return history fetched', req);
  }),

  getEarningsSummary: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const summary = await settlementService.getEarningsSummary(vendorId);
    return success(res, { summary }, 'Earnings summary fetched', undefined, req);
  }),

  listSettlements: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await settlementService.listSettlements(vendorId, req.query);
    return paginated(res, { settlements: data }, pagination, 'Settlements fetched', req);
  }),

  listPendingSettlements: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await settlementService.listPendingSettlements(vendorId, req.query);
    return paginated(res, { settlements: data }, pagination, 'Pending settlements fetched', req);
  }),

  getSettlementHistory: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await settlementService.getSettlementHistory(vendorId, req.query);
    return paginated(res, { settlements: data }, pagination, 'Settlement history fetched', req);
  }),

  requestPayout: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const payout = await settlementService.createPayoutRequest(vendorId, req.body.amountPaise);
    return created(res, { payout }, 'Payout request submitted', req);
  }),

  listPayoutRequests: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await settlementService.listPayoutRequests(vendorId, req.query);
    return paginated(res, { payouts: data }, pagination, 'Payout requests fetched', req);
  }),

  getDashboard: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const dashboard = await analyticsService.getDashboard(vendorId);
    return success(res, { dashboard }, 'Dashboard fetched', undefined, req);
  }),

  getRevenueSummary: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const summary = await analyticsService.getRevenueSummary(vendorId, req.query);
    return success(res, { summary }, 'Revenue summary fetched', undefined, req);
  }),

  listVendorsAdmin: asyncHandler(async (req, res) => {
    const { data, pagination } = await verificationService.listVendors(req.query);
    return paginated(res, { vendors: data }, pagination, 'Vendors fetched', req);
  }),

  getVendorAdmin: asyncHandler(async (req, res) => {
    const vendor = await verificationService.getVendor(req.params.vendorId);
    return success(res, { vendor }, 'Vendor fetched', undefined, req);
  }),

  approveVendor: asyncHandler(async (req, res) => {
    const vendor = await verificationService.approveVendor(
      req.params.vendorId,
      req.auth,
      req.body.note
    );
    return success(res, { vendor }, 'Vendor approved', undefined, req);
  }),

  rejectVendor: asyncHandler(async (req, res) => {
    const vendor = await verificationService.rejectVendor(
      req.params.vendorId,
      req.auth,
      req.body.reason
    );
    return success(res, { vendor }, 'Vendor rejected', undefined, req);
  }),

  suspendVendor: asyncHandler(async (req, res) => {
    const vendor = await verificationService.suspendVendor(
      req.params.vendorId,
      req.auth,
      req.body.reason
    );
    return success(res, { vendor }, 'Vendor suspended', undefined, req);
  }),

  reverifyVendor: asyncHandler(async (req, res) => {
    const vendor = await verificationService.requestReVerification(
      req.params.vendorId,
      req.auth,
      req.body.note
    );
    return success(res, { vendor }, 'Vendor sent for re-verification', undefined, req);
  }),

  listRfqs: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const { data, pagination } = await rfqService.listVendorRfqs(vendorId, req.query);
    return paginated(res, { rfqs: data }, pagination, 'RFQs fetched successfully', req);
  }),

  getRfq: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const rfq = await rfqService.getVendorRfq(vendorId, req.params.rfqId);
    return success(res, { rfq }, 'RFQ fetched successfully', undefined, req);
  }),

  submitQuote: asyncHandler(async (req, res) => {
    const vendorId = await vendorAccessPolicy.resolveApprovedVendorId(req.auth);
    const quote = await rfqService.submitQuote(vendorId, req.params.rfqId, req.body);
    return created(res, { quote }, 'Quote submitted successfully', req);
  }),
};

module.exports = vendorController;
