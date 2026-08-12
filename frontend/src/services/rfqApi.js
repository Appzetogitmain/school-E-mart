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

/** Drafts only — the server rejects requests already open to vendors. */
export const deleteRfq = async (schoolId, rfqId) => {
  await apiClient.delete(schoolRfqPath(schoolId, `/${rfqId}`));
};

export const updateRfq = async (schoolId, rfqId, payload) => {
  const response = await apiClient.patch(schoolRfqPath(schoolId, `/${rfqId}`), payload);
  return unwrapData(response)?.rfq;
};

/** Only valid while the request is still open/under review — the server rejects
 *  cancelling anything already awarded (a real contract) or already terminal. */
export const cancelRfq = async (schoolId, rfqId) => {
  const response = await apiClient.patch(schoolRfqPath(schoolId, `/${rfqId}`), { status: 'cancelled' });
  return unwrapData(response)?.rfq;
};

export const awardRfqQuote = async (schoolId, rfqId, quoteId) => {
  const response = await apiClient.post(
    schoolRfqPath(schoolId, `/${rfqId}/quotes/${quoteId}/award`)
  );
  return unwrapData(response)?.rfq;
};

const rfqOrderPath = (schoolId, orderId, suffix = '') =>
  `/schools/${schoolId}/rfq-orders/${orderId}${suffix}`;

/** Creates the gateway payment for the vendor-set advance on an awarded RFQ
 *  order. Returns { payment, checkout } — checkout is null once nothing is
 *  left to collect from the gateway (e.g. a 0% advance). */
export const initiateRfqAdvancePayment = async (schoolId, orderId) => {
  const response = await apiClient.post(rfqOrderPath(schoolId, orderId, '/advance/initiate'));
  return unwrapData(response);
};

/** Confirms the advance after the Razorpay checkout completes. */
export const confirmRfqAdvancePayment = async (schoolId, orderId, payload = {}) => {
  const response = await apiClient.post(rfqOrderPath(schoolId, orderId, '/advance/confirm'), payload);
  return unwrapData(response);
};

/** Creates the gateway payment for whatever's left of the order total, once
 *  the advance has already been captured. Available any time after that —
 *  there's no gate tied to delivery status. */
export const initiateRfqRemainderPayment = async (schoolId, orderId) => {
  const response = await apiClient.post(rfqOrderPath(schoolId, orderId, '/remainder/initiate'));
  return unwrapData(response);
};

/** Confirms the remainder after the Razorpay checkout completes, settling the order. */
export const confirmRfqRemainderPayment = async (schoolId, orderId, payload = {}) => {
  const response = await apiClient.post(rfqOrderPath(schoolId, orderId, '/remainder/confirm'), payload);
  return unwrapData(response);
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
