import apiClient from './apiClient';

export const createOrder = async (payload) => {
  const response = await apiClient.post('/orders', {
    audience: 'parent',
    ...payload,
  });
  return response.data.data;
};

export const confirmPayment = async (orderId, paymentDetails = {}) => {
  const response = await apiClient.post(`/orders/${orderId}/payment/confirm`, paymentDetails);
  return response.data.data;
};

export const getCheckoutSummary = async (payload) => {
  const response = await apiClient.post('/orders/checkout/summary', {
    audience: 'parent',
    ...payload,
  });
  return response.data.data.summary;
};
