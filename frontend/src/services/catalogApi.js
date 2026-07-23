import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';
import { getMarketplaceAudience } from '../utils/marketplaceAudience';

// The School module shows 'schools' (bulk) products; the User app shows 'users'
// (retail). Callers can override by passing `audience` explicitly.
const storefrontAudience = () => (getMarketplaceAudience() === 'school' ? 'schools' : 'users');

const extractPaginated = (response) => {
  const { data, pagination } = response.data;
  return {
    data:
      data?.products ||
      data?.headerCategories ||
      data?.categories ||
      data?.subcategories ||
      data?.banners ||
      data?.reels ||
      data,
    pagination: pagination || null,
  };
};

export const getCategoryTree = async (params = {}) => {
  const response = await apiClient.get('/catalog/categories/tree', { params });
  return unwrapData(response)?.tree || [];
};

export const listHeaderCategories = async (params = {}) => {
  const response = await apiClient.get('/catalog/header-categories', { params });
  return extractPaginated(response);
};

export const listPublicBanners = async (params = {}) => {
  const response = await apiClient.get('/catalog/banners', { params });
  return extractPaginated(response);
};

export const listPublicReels = async (params = {}) => {
  const response = await apiClient.get('/catalog/reels', { params });
  return extractPaginated(response);
};

const withSearchQuery = (params = {}) => {
  const { search, ...rest } = params;
  if (search) rest.q = search;
  return rest;
};

export const listProducts = async (params = {}) => {
  const query = { audience: storefrontAudience(), ...withSearchQuery(params) };
  const response = await apiClient.get('/catalog/products', { params: query });
  return extractPaginated(response);
};

export const listFeaturedProducts = async (params = {}) => {
  const query = { audience: storefrontAudience(), ...params };
  const response = await apiClient.get('/catalog/products/featured', { params: query });
  return extractPaginated(response);
};

export const listOfferProducts = async (params = {}) => {
  const query = { audience: storefrontAudience(), ...params };
  const response = await apiClient.get('/catalog/products/offers', { params: query });
  return extractPaginated(response);
};

export const getProduct = async (productId) => {
  const response = await apiClient.get(`/catalog/products/${productId}`);
  return unwrapData(response);
};

export const getRelatedProducts = async (productId, params = {}) => {
  const response = await apiClient.get(`/catalog/products/${productId}/related`, { params });
  const data = unwrapData(response);
  return data?.products || [];
};

export const getProductReviews = async (productId, params = {}) => {
  const response = await apiClient.get(`/catalog/products/${productId}/reviews`, { params });
  return extractPaginated(response);
};

export const createHeaderCategory = async (payload) => {
  const response = await apiClient.post('/catalog/header-categories', payload);
  return unwrapData(response);
};

export const updateHeaderCategory = async (id, payload) => {
  const response = await apiClient.patch(`/catalog/header-categories/${id}`, payload);
  return unwrapData(response);
};

export const deleteHeaderCategory = async (id) => {
  const response = await apiClient.delete(`/catalog/header-categories/${id}`);
  return unwrapData(response);
};

export const createCategory = async (payload) => {
  const response = await apiClient.post('/catalog/categories', payload);
  return unwrapData(response);
};

export const updateCategory = async (id, payload) => {
  const response = await apiClient.patch(`/catalog/categories/${id}`, payload);
  return unwrapData(response);
};

export const deleteCategory = async (id) => {
  const response = await apiClient.delete(`/catalog/categories/${id}`);
  return unwrapData(response);
};

export const createSubcategory = async (payload) => {
  const response = await apiClient.post('/catalog/subcategories', payload);
  return unwrapData(response);
};

export const updateSubcategory = async (id, payload) => {
  const response = await apiClient.patch(`/catalog/subcategories/${id}`, payload);
  return unwrapData(response);
};

export const deleteSubcategory = async (id) => {
  const response = await apiClient.delete(`/catalog/subcategories/${id}`);
  return unwrapData(response);
};

/**
 * Admin-only catalog listing. Unlike listProducts (public, approved+published only)
 * this returns products in every moderation state, so pending/rejected items are
 * visible and actionable.
 */
export const listAdminProducts = async (params = {}) => {
  const response = await apiClient.get('/catalog/admin/products', { params: withSearchQuery(params) });
  return extractPaginated(response);
};

export const updateProduct = async (productId, payload) => {
  const response = await apiClient.patch(`/catalog/products/${productId}`, payload);
  return unwrapData(response);
};

export const deleteProduct = async (productId) => {
  const response = await apiClient.delete(`/catalog/products/${productId}`);
  return unwrapData(response);
};

export const setProductApprovalStatus = async (productId, approvalStatus) => {
  const response = await apiClient.patch(`/catalog/products/${productId}/approval-status`, {
    approvalStatus,
  });
  return unwrapData(response);
};
