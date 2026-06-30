const DEVICE_ID_KEY = 'fcm-device-id';
const REGISTERED_TOKEN_KEY = 'fcm-registered-token';

const generateDeviceId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

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
