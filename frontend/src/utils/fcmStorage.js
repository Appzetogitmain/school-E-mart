const REGISTERED_TOKEN_KEY = 'fcm-registered-token';

export const getRegisteredToken = () => localStorage.getItem(REGISTERED_TOKEN_KEY);

export const setRegisteredToken = (token) => {
  if (token) {
    localStorage.setItem(REGISTERED_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REGISTERED_TOKEN_KEY);
  }
};

export const isNotificationSupported = () =>
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator;

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};
