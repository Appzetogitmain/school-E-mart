import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const extractPaginated = (response) => {
  const { data, pagination } = response.data;
  return {
    data: data?.products || data?.headerCategories || data?.categories || data?.subcategories || data,
    pagination: pagination || null,
  };
};

export const getCategoryTree = async () => {
  const response = await apiClient.get('/catalog/categories/tree');
  return unwrapData(response)?.tree || [];
};

export const listHeaderCategories = async (params = {}) => {
  const response = await apiClient.get('/catalog/header-categories', { params });
  return extractPaginated(response);
};

const withSearchQuery = (params = {}) => {
  const { search, ...rest } = params;
  if (search) rest.q = search;
  return rest;
};

export const listProducts = async (params = {}) => {
  const response = await apiClient.get('/catalog/products', { params: withSearchQuery(params) });
  return extractPaginated(response);
};

export const listFeaturedProducts = async (params = {}) => {
  const response = await apiClient.get('/catalog/products/featured', { params });
  return extractPaginated(response);
};

export const listOfferProducts = async (params = {}) => {
  const response = await apiClient.get('/catalog/products/offers', { params });
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
