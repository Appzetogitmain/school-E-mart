import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

export const requestParentOtp = async (phone) => {
  const response = await apiClient.post('/auth/parent/otp/request', { phone });
  return unwrapData(response);
};

export const verifyParentOtp = async (phone, otp) => {
  const response = await apiClient.post('/auth/parent/otp/verify', { phone, otp });
  return unwrapData(response);
};

// Guest checkout: OTP to a shopper with no account. Verify creates an unlinked
// customer (no school, no child) and returns an authenticated session.
export const requestCustomerOtp = async (phone) => {
  const response = await apiClient.post('/auth/customer/otp/request', { phone });
  return unwrapData(response);
};

export const verifyCustomerOtp = async (phone, otp, name) => {
  const response = await apiClient.post('/auth/customer/otp/verify', { phone, otp, name });
  return unwrapData(response);
};

export const requestParentRegisterOtp = async (phone) => {
  const response = await apiClient.post('/auth/parent/web/register/otp/request', { phone });
  return unwrapData(response);
};

export const verifyParentRegisterOtp = async (phone, otp) => {
  const response = await apiClient.post('/auth/parent/web/register/otp/verify', { phone, otp });
  return unwrapData(response);
};

export const parentWebLogin = async (mobile, otp) => {
  const response = await apiClient.post('/auth/parent/web/login', { mobile, otp });
  return unwrapData(response);
};

export const schoolAdminLogin = async (email, password) => {
  const response = await apiClient.post('/auth/school/admin/login', { email, password });
  return unwrapData(response);
};

export const teacherLogin = async (email, password) => {
  const response = await apiClient.post('/auth/school/teacher/login', { email, password });
  return unwrapData(response);
};

export const teacherRegister = async (payload) => {
  const response = await apiClient.post('/auth/school/teacher/register', payload);
  return unwrapData(response);
};

export const schoolAdminRegister = async (payload) => {
  const response = await apiClient.post('/auth/school/admin/register', payload);
  return unwrapData(response);
};

export const vendorLogin = async (email, password) => {
  const response = await apiClient.post('/auth/vendor/login', { email, password });
  return unwrapData(response);
};

export const adminLogin = async (email, password) => {
  const response = await apiClient.post('/auth/admin/login', { email, password });
  return unwrapData(response);
};

export const vendorRegister = async (payload) => {
  const response = await apiClient.post('/vendor/register', payload);
  return unwrapData(response);
};

export const refreshSession = async () => {
  const response = await apiClient.post('/auth/refresh', {});
  return unwrapData(response);
};

export const logout = async (revokeAll = false) => {
  await apiClient.post('/auth/logout', { revokeAll });
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  const data = unwrapData(response);
  return data?.user;
};

export const changePassword = async (payload) => {
  await apiClient.post('/auth/change-password', payload);
};

export const lookupSchoolForRegistration = async (ref) => {
  const response = await apiClient.get('/auth/parent/school-lookup', {
    params: { ref: ref.trim() },
  });
  return unwrapData(response);
};
