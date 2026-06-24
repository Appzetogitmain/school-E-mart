import apiClient from './apiClient';
import { getMarketplaceAudience } from '../utils/marketplaceAudience';

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
