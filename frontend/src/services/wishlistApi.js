import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const withAudience = (audience, params = {}) => ({ audience, ...params });

export const getWishlist = async (audience) => {
  const response = await apiClient.get('/catalog/wishlist', { params: withAudience(audience) });
  return unwrapData(response);
};

export const addWishlistItem = async (audience, productId) => {
  const response = await apiClient.post(
    '/catalog/wishlist/items',
    { productId },
    { params: withAudience(audience) }
  );
  return unwrapData(response)?.wishlist;
};

export const removeWishlistItem = async (audience, productId) => {
  const response = await apiClient.delete(`/catalog/wishlist/items/${productId}`, {
    params: withAudience(audience),
  });
  return unwrapData(response)?.wishlist;
};
