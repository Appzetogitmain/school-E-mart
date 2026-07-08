import apiClient from './apiClient';
import { unwrapData } from '../utils/apiHelpers';

const extractPaginated = (response, key) => {
  const { data, pagination } = response.data;
  return { data: data?.[key] || [], pagination: pagination || null };
};

export const listSupportTopics = async (audience) => {
  const response = await apiClient.get('/support/topics', {
    params: audience ? { audience } : {},
  });
  return unwrapData(response)?.topics || [];
};

export const createSupportTicket = async (payload) => {
  const response = await apiClient.post('/support/tickets', payload);
  return unwrapData(response)?.ticket;
};

export const listMySupportTickets = async (params = {}) => {
  const response = await apiClient.get('/support/tickets', { params });
  return extractPaginated(response, 'tickets');
};

export const getMySupportTicket = async (ticketId) => {
  const response = await apiClient.get(`/support/tickets/${ticketId}`);
  return unwrapData(response)?.ticket;
};

export const replyToSupportTicket = async (ticketId, body) => {
  const response = await apiClient.post(`/support/tickets/${ticketId}/messages`, { body });
  return unwrapData(response)?.ticket;
};

// Admin
export const listAllSupportTickets = async (params = {}) => {
  const response = await apiClient.get('/support/admin/tickets', { params });
  return extractPaginated(response, 'tickets');
};

export const getSupportTicketAdmin = async (ticketId) => {
  const response = await apiClient.get(`/support/admin/tickets/${ticketId}`);
  return unwrapData(response)?.ticket;
};

export const replyToSupportTicketAdmin = async (ticketId, body) => {
  const response = await apiClient.post(`/support/admin/tickets/${ticketId}/reply`, { body });
  return unwrapData(response)?.ticket;
};

export const updateSupportTicketStatus = async (ticketId, status, assignedTo) => {
  const response = await apiClient.patch(`/support/admin/tickets/${ticketId}/status`, {
    status,
    ...(assignedTo ? { assignedTo } : {}),
  });
  return unwrapData(response);
};
