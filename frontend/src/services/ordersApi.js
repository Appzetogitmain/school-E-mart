import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';
import { getMarketplaceAudience } from '../utils/marketplaceAudience';

const extractPaginated = (response) => {
  const { data, pagination } = response.data;
  return {
    data: data?.orders || [],
    pagination: pagination || null,
  };
};

export const createOrder = async (payload, options = {}) => {
  const audience = options.audience || payload.audience || getMarketplaceAudience();
  const response = await apiClient.post('/orders', {
    audience,
    ...payload,
  });
  return response.data.data;
};

export const confirmPayment = async (orderId, paymentDetails = {}) => {
  const response = await apiClient.post(`/orders/${orderId}/payment/confirm`, paymentDetails);
  return response.data.data;
};

export const getCheckoutSummary = async (payload, options = {}) => {
  const audience = options.audience || payload.audience || getMarketplaceAudience();
  const response = await apiClient.post('/orders/checkout/summary', {
    audience,
    ...payload,
  });
  return response.data.data.summary;
};

export const listOrders = async (params = {}, options = {}) => {
  const audience = options.audience || params.audience || getMarketplaceAudience();
  const response = await apiClient.get('/orders', {
    params: { audience, ...params },
  });
  return extractPaginated(response);
};

export const getOrder = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}`);
  return unwrapData(response)?.order;
};

export const getOrderTimeline = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}/timeline`);
  return unwrapData(response)?.timeline || [];
};

export const trackOrder = async (orderNumber) => {
  const response = await apiClient.get(`/orders/track/${encodeURIComponent(orderNumber)}`);
  return unwrapData(response);
};

export const cancelOrder = async (orderId, reason) => {
  const response = await apiClient.post(`/orders/${orderId}/cancel`, { reason });
  return unwrapData(response)?.order;
};

export const getOrderShipments = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}/shipments`);
  return unwrapData(response)?.shipments || [];
};

/**
 * Counts and money totals for whatever filter the order list is showing. Takes
 * the same query parameters as listOrders, so the cards and the table always
 * describe the same set of orders.
 */
export const getOrderStats = async (params = {}) => {
  const response = await apiClient.get('/orders/stats', { params });
  return unwrapData(response)?.stats || null;
};

/**
 * Every payment attached to an order, including what the gateway last reported.
 * The admin order view compares these against our own status rather than making
 * an operator open the Razorpay dashboard in another tab to find out.
 */
export const getOrderPayments = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}/payments`);
  return unwrapData(response)?.payments || [];
};

/** Force a fresh comparison against the payment gateway for one order. */
export const reconcileOrder = async (orderId) => {
  const response = await apiClient.post(`/orders/${orderId}/reconcile`);
  return unwrapData(response);
};

/** Payments whose gateway state disagrees with ours — the money that needs a human. */
export const listPaymentMismatches = async (params = {}) => {
  const response = await apiClient.get('/orders/payments/mismatches', { params });
  return unwrapData(response)?.mismatches || [];
};

export const resolvePaymentMismatch = async (paymentId, note) => {
  const response = await apiClient.post(`/orders/payments/${paymentId}/resolve`, { note });
  return unwrapData(response)?.payment;
};

export const getOrderRefunds = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}/refunds`);
  return unwrapData(response)?.refunds || [];
};

export const getInvoice = async (orderId) => {
  const response = await apiClient.get(`/orders/${orderId}/invoice`);
  return unwrapData(response)?.invoice;
};
