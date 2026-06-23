const ORDER_TRANSITIONS = {
  placed: ['accepted', 'cancelled'],
  accepted: ['processed', 'cancelled'],
  processed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: ['returned'],
  cancelled: [],
  returned: [],
};

const CUSTOMER_CANCELLABLE = new Set(['placed', 'accepted']);
const ADMIN_CANCELLABLE = new Set(['placed', 'accepted', 'processed', 'packed']);
const VENDOR_CANCELLABLE = new Set(['placed', 'accepted', 'processed', 'packed']);

const RETURN_ELIGIBLE = new Set(['delivered']);

const canTransition = (from, to) => (ORDER_TRANSITIONS[from] || []).includes(to);

const canCustomerCancel = (status) => CUSTOMER_CANCELLABLE.has(status);

const canAdminCancel = (status) => ADMIN_CANCELLABLE.has(status);

const canVendorCancel = (status) => VENDOR_CANCELLABLE.has(status);

module.exports = {
  ORDER_TRANSITIONS,
  CUSTOMER_CANCELLABLE,
  ADMIN_CANCELLABLE,
  VENDOR_CANCELLABLE,
  RETURN_ELIGIBLE,
  canTransition,
  canCustomerCancel,
  canAdminCancel,
  canVendorCancel,
};
