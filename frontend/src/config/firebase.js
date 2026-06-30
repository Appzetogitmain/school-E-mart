import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';
import { ENV, isFirebaseConfigured } from './env';

const firebaseConfig = {
  apiKey: ENV.FIREBASE_API_KEY,
  authDomain: ENV.FIREBASE_AUTH_DOMAIN,
  projectId: ENV.FIREBASE_PROJECT_ID,
  storageBucket: ENV.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.FIREBASE_APP_ID,
  measurementId: ENV.FIREBASE_MEASUREMENT_ID,
};

let messagingInstance = null;
let messagingSupported = null;

export const getFirebaseApp = () => {
  if (!isFirebaseConfigured()) return null;
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
};

export const checkMessagingSupport = async () => {
  if (messagingSupported !== null) return messagingSupported;
  if (!isFirebaseConfigured()) {
    messagingSupported = false;
    return false;
  }
  try {
    messagingSupported = await isSupported();
  } catch {
    messagingSupported = false;
  }
  return messagingSupported;
};

export const getFirebaseMessaging = async () => {
  const supported = await checkMessagingSupport();
  if (!supported) return null;

  if (!messagingInstance) {
    const app = getFirebaseApp();
    if (!app) return null;
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};
