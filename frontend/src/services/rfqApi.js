import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const schoolRfqPath = (schoolId, suffix = '') => `/schools/${schoolId}/rfqs${suffix}`;

const extractPaginated = (response, key) => {
  const { data, pagination } = response.data;
  return {
    data: data?.[key] || [],
    pagination: pagination || null,
  };
};

export const createRfq = async (schoolId, payload) => {
  const response = await apiClient.post(schoolRfqPath(schoolId), payload);
  return unwrapData(response)?.rfq;
};

export const listSchoolRfqs = async (schoolId, params = {}) => {
  const response = await apiClient.get(schoolRfqPath(schoolId), { params });
  return extractPaginated(response, 'rfqs');
};

export const getSchoolRfq = async (schoolId, rfqId) => {
  const response = await apiClient.get(schoolRfqPath(schoolId, `/${rfqId}`));
  return unwrapData(response)?.rfq;
};

export const updateRfq = async (schoolId, rfqId, payload) => {
  const response = await apiClient.patch(schoolRfqPath(schoolId, `/${rfqId}`), payload);
  return unwrapData(response)?.rfq;
};

export const awardRfqQuote = async (schoolId, rfqId, quoteId) => {
  const response = await apiClient.post(
    schoolRfqPath(schoolId, `/${rfqId}/quotes/${quoteId}/award`)
  );
  return unwrapData(response)?.rfq;
};

export const listVendorRfqs = async (params = {}) => {
  const response = await apiClient.get('/vendor/rfqs', { params });
  return extractPaginated(response, 'rfqs');
};

export const getVendorRfq = async (rfqId) => {
  const response = await apiClient.get(`/vendor/rfqs/${rfqId}`);
  return unwrapData(response)?.rfq;
};

export const submitVendorQuote = async (rfqId, payload) => {
  const response = await apiClient.post(`/vendor/rfqs/${rfqId}/quotes`, payload);
  return unwrapData(response)?.quote;
};
