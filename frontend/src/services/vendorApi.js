import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const extractPaginated = (response, key) => {
  const { data, pagination } = response.data;
  return {
    data: data?.[key] || [],
    pagination: pagination || null,
  };
};

// Profile
export const getVendorProfile = async () => {
  const response = await apiClient.get('/vendor/me/profile');
  return unwrapData(response)?.profile;
};

export const updateVendorProfile = async (payload) => {
  const response = await apiClient.put('/vendor/me/profile', payload);
  return unwrapData(response)?.profile;
};

export const updateVendorAddress = async (payload) => {
  const response = await apiClient.patch('/vendor/me/address', payload);
  return unwrapData(response)?.profile;
};

export const updateVendorBusiness = async (payload) => {
  const response = await apiClient.patch('/vendor/me/business', payload);
  return unwrapData(response)?.profile;
};

export const updateVendorTax = async (payload) => {
  const response = await apiClient.patch('/vendor/me/tax', payload);
  return unwrapData(response)?.profile;
};

export const updateVendorBank = async (payload) => {
  const response = await apiClient.patch('/vendor/me/bank', payload);
  return unwrapData(response)?.profile;
};

// KYC files must be uploaded first; the returned attachment id is then attached
// to the profile via addVendorDocument.
export const uploadVendorDocument = async (formData) => {
  const response = await apiClient.post('/vendor/me/uploads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrapData(response)?.attachment;
};

export const addVendorDocument = async (payload) => {
  const response = await apiClient.post('/vendor/me/documents', payload);
  return unwrapData(response)?.profile;
};

export const getVendorStatus = async () => {
  const response = await apiClient.get('/vendor/me/status');
  return unwrapData(response)?.status;
};

// Products
export const listVendorProducts = async (params = {}) => {
  const response = await apiClient.get('/vendor/products', { params });
  return extractPaginated(response, 'products');
};

export const getVendorProduct = async (productId) => {
  const response = await apiClient.get(`/vendor/products/${productId}`);
  return unwrapData(response)?.product;
};

export const createVendorProduct = async (payload) => {
  const response = await apiClient.post('/vendor/products', payload);
  return unwrapData(response)?.product;
};

export const updateVendorProduct = async (productId, payload) => {
  const response = await apiClient.patch(`/vendor/products/${productId}`, payload);
  return unwrapData(response)?.product;
};

export const deleteVendorProduct = async (productId) => {
  const response = await apiClient.delete(`/vendor/products/${productId}`);
  return unwrapData(response);
};

export const setVendorProductPublishStatus = async (productId, publishStatus) => {
  const response = await apiClient.patch(`/vendor/products/${productId}/publish`, { publishStatus });
  return unwrapData(response)?.product;
};

// Inventory
export const updateVendorInventory = async (productId, payload) => {
  const response = await apiClient.patch(`/vendor/products/${productId}/inventory`, payload);
  return unwrapData(response);
};

export const adjustVendorInventory = async (productId, payload) => {
  const response = await apiClient.post(`/vendor/products/${productId}/inventory/adjust`, payload);
  return unwrapData(response);
};

export const listVendorLowStock = async (params = {}) => {
  const response = await apiClient.get('/vendor/inventory/low-stock', { params });
  return extractPaginated(response, 'products');
};

// Orders
export const listVendorOrders = async (params = {}) => {
  const response = await apiClient.get('/vendor/orders', { params });
  return extractPaginated(response, 'orders');
};

export const getVendorOrder = async (orderId) => {
  const response = await apiClient.get(`/vendor/orders/${orderId}`);
  return unwrapData(response)?.order;
};

export const acceptVendorOrder = async (orderId, note) => {
  const response = await apiClient.post(`/vendor/orders/${orderId}/accept`, { note });
  return unwrapData(response)?.order;
};

export const rejectVendorOrder = async (orderId, reason) => {
  const response = await apiClient.post(`/vendor/orders/${orderId}/reject`, { reason });
  return unwrapData(response)?.order;
};

export const processVendorOrder = async (orderId, note) => {
  const response = await apiClient.post(`/vendor/orders/${orderId}/process`, { note });
  return unwrapData(response)?.order;
};

export const markVendorOrderReadyForDispatch = async (orderId, note) => {
  const response = await apiClient.post(`/vendor/orders/${orderId}/ready-for-dispatch`, { note });
  return unwrapData(response)?.order;
};

export const updateVendorOrderStatus = async (orderId, payload) => {
  const response = await apiClient.patch(`/vendor/orders/${orderId}/status`, payload);
  return unwrapData(response)?.order;
};

// Returns
export const listVendorReturns = async (params = {}) => {
  const response = await apiClient.get('/vendor/returns', { params });
  return extractPaginated(response, 'returns');
};

export const getVendorReturn = async (returnId) => {
  const response = await apiClient.get(`/vendor/returns/${returnId}`);
  return unwrapData(response)?.return;
};

export const approveVendorReturn = async (returnId, note) => {
  const response = await apiClient.post(`/vendor/returns/${returnId}/approve`, { note });
  return unwrapData(response)?.return;
};

export const rejectVendorReturn = async (returnId, reason) => {
  const response = await apiClient.post(`/vendor/returns/${returnId}/reject`, { reason });
  return unwrapData(response)?.return;
};

export const updateVendorReturnStatus = async (returnId, payload) => {
  const response = await apiClient.patch(`/vendor/returns/${returnId}/status`, payload);
  return unwrapData(response)?.return;
};

// Settlements & analytics
export const getVendorEarningsSummary = async () => {
  const response = await apiClient.get('/vendor/settlements/earnings');
  return unwrapData(response)?.summary;
};

export const listVendorSettlements = async (params = {}) => {
  const response = await apiClient.get('/vendor/settlements', { params });
  return extractPaginated(response, 'settlements');
};

export const listVendorPendingSettlements = async (params = {}) => {
  const response = await apiClient.get('/vendor/settlements/pending', { params });
  return extractPaginated(response, 'settlements');
};

export const listVendorPayoutRequests = async (params = {}) => {
  const response = await apiClient.get('/vendor/settlements/payouts', { params });
  return extractPaginated(response, 'payouts');
};

export const requestVendorPayout = async (amountPaise) => {
  const response = await apiClient.post('/vendor/settlements/payouts', { amountPaise });
  return unwrapData(response)?.payout;
};

export const getVendorDashboard = async () => {
  const response = await apiClient.get('/vendor/overview/dashboard');
  return unwrapData(response)?.dashboard;
};
