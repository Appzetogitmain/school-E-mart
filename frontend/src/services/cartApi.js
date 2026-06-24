import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const withAudience = (audience, params = {}) => ({ audience, ...params });

export const getCart = async (audience) => {
  const response = await apiClient.get('/catalog/cart', { params: withAudience(audience) });
  return unwrapData(response)?.cart;
};

export const getCartSummary = async (audience) => {
  const response = await apiClient.get('/catalog/cart/summary', { params: withAudience(audience) });
  return unwrapData(response)?.cart;
};

export const addCartItem = async (audience, payload) => {
  const response = await apiClient.post('/catalog/cart/items', payload, {
    params: withAudience(audience),
  });
  return unwrapData(response)?.cart;
};

export const updateCartItemQuantity = async (audience, productId, quantity, variantId) => {
  const response = await apiClient.patch(
    `/catalog/cart/items/${productId}`,
    { quantity },
    {
      params: {
        audience,
        ...(variantId ? { variantId } : {}),
      },
    }
  );
  return unwrapData(response)?.cart;
};

export const removeCartItem = async (audience, productId, variantId) => {
  const response = await apiClient.delete(`/catalog/cart/items/${productId}`, {
    params: {
      audience,
      ...(variantId ? { variantId } : {}),
    },
  });
  return unwrapData(response)?.cart;
};

export const clearCart = async (audience) => {
  const response = await apiClient.delete('/catalog/cart', { params: withAudience(audience) });
  return unwrapData(response)?.cart;
};
