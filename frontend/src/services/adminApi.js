import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const extractPaginated = (response, key) => {
  const { data, pagination } = response.data;
  return {
    data: data?.[key] || [],
    pagination: pagination || null,
  };
};

export const getDashboard = async (params = {}) => {
  const response = await apiClient.get('/admin/dashboard', { params });
  return unwrapData(response);
};

export const getOrderAnalytics = async (params = {}) => {
  const response = await apiClient.get('/admin/analytics/orders', { params });
  return unwrapData(response)?.analytics;
};

export const listUsers = async (params = {}) => {
  const response = await apiClient.get('/admin/users', { params });
  return extractPaginated(response, 'users');
};

export const suspendUser = async (userId, payload = {}) => {
  const response = await apiClient.patch(`/admin/users/${userId}/suspend`, payload);
  return unwrapData(response)?.user;
};

export const activateUser = async (userId) => {
  const response = await apiClient.patch(`/admin/users/${userId}/activate`);
  return unwrapData(response)?.user;
};

export const listVendors = async (params = {}) => {
  const response = await apiClient.get('/admin/vendors', { params });
  return extractPaginated(response, 'vendors');
};

export const listPendingVendors = async (params = {}) => {
  const response = await apiClient.get('/admin/vendors/pending', { params });
  return extractPaginated(response, 'vendors');
};

export const approveVendor = async (vendorId, payload = {}) => {
  const response = await apiClient.post(`/admin/vendors/${vendorId}/approve`, payload);
  return unwrapData(response)?.vendor;
};

export const rejectVendor = async (vendorId, payload = {}) => {
  const response = await apiClient.post(`/admin/vendors/${vendorId}/reject`, payload);
  return unwrapData(response)?.vendor;
};

export const suspendVendor = async (vendorId, payload = {}) => {
  const response = await apiClient.post(`/admin/vendors/${vendorId}/suspend`, payload);
  return unwrapData(response)?.vendor;
};

export const reactivateVendor = async (vendorId, payload = {}) => {
  const response = await apiClient.post(`/admin/vendors/${vendorId}/reactivate`, payload);
  return unwrapData(response)?.vendor;
};

export const listSchools = async (params = {}) => {
  const response = await apiClient.get('/admin/schools', { params });
  return extractPaginated(response, 'schools');
};

export const listPendingSchools = async (params = {}) => {
  const response = await apiClient.get('/admin/schools/pending', { params });
  return extractPaginated(response, 'schools');
};

export const getSchool = async (schoolId) => {
  const response = await apiClient.get(`/admin/schools/${schoolId}`);
  return unwrapData(response)?.school;
};

export const approveSchool = async (schoolId, payload = {}) => {
  const response = await apiClient.post(`/admin/schools/${schoolId}/approve`, payload);
  return unwrapData(response)?.school;
};

export const rejectSchool = async (schoolId, payload = {}) => {
  const response = await apiClient.post(`/admin/schools/${schoolId}/reject`, payload);
  return unwrapData(response)?.school;
};

export const suspendSchool = async (schoolId, payload = {}) => {
  const response = await apiClient.post(`/admin/schools/${schoolId}/suspend`, payload);
  return unwrapData(response)?.school;
};

export const reactivateSchool = async (schoolId, payload = {}) => {
  const response = await apiClient.post(`/admin/schools/${schoolId}/reactivate`, payload);
  return unwrapData(response)?.school;
};

export const listFaqs = async (params = {}) => {
  const response = await apiClient.get('/admin/cms/faqs', { params });
  return extractPaginated(response, 'faqs');
};

export const getContactInfo = async () => {
  const response = await apiClient.get('/admin/cms/contact');
  return unwrapData(response)?.content || unwrapData(response);
};

export const createFaq = async (payload) => {
  const response = await apiClient.post('/admin/cms/faqs', payload);
  return unwrapData(response)?.faq;
};

export const updateFaq = async (faqId, payload) => {
  const response = await apiClient.patch(`/admin/cms/faqs/${faqId}`, payload);
  return unwrapData(response)?.faq;
};

export const deleteFaq = async (faqId) => {
  const response = await apiClient.delete(`/admin/cms/faqs/${faqId}`);
  return unwrapData(response);
};

export const listBanners = async (params = {}) => {
  const response = await apiClient.get('/admin/cms/banners', { params });
  return extractPaginated(response, 'banners');
};

export const deleteBanner = async (bannerId) => {
  const response = await apiClient.delete(`/admin/cms/banners/${bannerId}`);
  return unwrapData(response);
};

export const listCmsSections = async (params = {}) => {
  const response = await apiClient.get('/admin/cms/sections', { params });
  return extractPaginated(response, 'sections');
};

export const getMarketplaceSettings = async () => {
  const response = await apiClient.get('/admin/settings/marketplace');
  return unwrapData(response)?.settings;
};

export const updateMarketplaceSettings = async (payload) => {
  const response = await apiClient.put('/admin/settings/marketplace', payload);
  return unwrapData(response)?.settings;
};

export const listPlatformCourses = async (params = {}) => {
  const response = await apiClient.get('/admin/lms/courses', { params });
  return extractPaginated(response, 'courses');
};

export const createPlatformCourse = async (payload) => {
  const response = await apiClient.post('/admin/lms/courses', payload);
  return unwrapData(response)?.course;
};

export const updatePlatformCourse = async (courseId, payload) => {
  const response = await apiClient.patch(`/admin/lms/courses/${courseId}`, payload);
  return unwrapData(response)?.course;
};

export const deletePlatformCourse = async (courseId) => {
  const response = await apiClient.delete(`/admin/lms/courses/${courseId}`);
  return unwrapData(response);
};

export const setPlatformCourseStatus = async (courseId, status) => {
  const response = await apiClient.patch(`/admin/lms/courses/${courseId}/status`, { status });
  return unwrapData(response)?.course;
};
