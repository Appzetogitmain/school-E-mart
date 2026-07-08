import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

export const getMyWallet = async () => {
  const response = await apiClient.get('/me/wallet');
  return unwrapData(response)?.wallet;
};

export const listMyWalletTransactions = async (params = {}) => {
  const response = await apiClient.get('/me/wallet/transactions', { params });
  const { data, pagination } = response.data;
  return { data: data?.transactions || [], pagination: pagination || null };
};

export const getMyReferral = async () => {
  const response = await apiClient.get('/me/referral');
  return unwrapData(response);
};

export const recordReferralInvite = async (phone) => {
  const response = await apiClient.post('/me/referral/invites', { phone });
  return unwrapData(response)?.invitee;
};
