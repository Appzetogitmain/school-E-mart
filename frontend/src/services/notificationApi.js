import apiClient from './apiClient';

export const registerFcmToken = async ({ token, platform = 'web' }) => {
  const { data } = await apiClient.post('/notifications/tokens', { token, platform });
  return data;
};

export const unregisterFcmToken = async ({ token } = {}) => {
  const { data } = await apiClient.delete('/notifications/tokens', {
    data: { token },
  });
  return data;
};

export const listNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  const { data } = await apiClient.get('/notifications', {
    params: { page, limit, unreadOnly },
  });
  return data;
};

export const getUnreadNotificationCount = async () => {
  const { data } = await apiClient.get('/notifications/unread-count');
  return data;
};

export const markNotificationAsRead = async (notificationId) => {
  const { data } = await apiClient.patch(`/notifications/${notificationId}/read`);
  return data;
};

export const markAllNotificationsAsRead = async () => {
  const { data } = await apiClient.patch('/notifications/read-all');
  return data;
};
