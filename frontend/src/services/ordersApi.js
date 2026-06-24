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
