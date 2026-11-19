const metaEnv = (typeof import.meta !== 'undefined' && import.meta?.env) ? import.meta.env : {};

export const ENV = {
  API_URL: metaEnv.VITE_API_URL || '/api/v1',
  BASE_URL: metaEnv.VITE_BASE_URL || 'http://localhost:5173',
  RAZORPAY_KEY_ID: metaEnv.VITE_RAZORPAY_KEY_ID || '',
  APP_NAME: 'School E-Mart',
  FIREBASE_API_KEY: metaEnv.VITE_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: metaEnv.VITE_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: metaEnv.VITE_FIREBASE_APP_ID || '',
  FIREBASE_MEASUREMENT_ID: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || '',
  FIREBASE_VAPID_KEY: metaEnv.VITE_FIREBASE_VAPID_KEY || '',
};

export const isFirebaseConfigured = () =>
  Boolean(
    ENV.FIREBASE_API_KEY &&
      ENV.FIREBASE_PROJECT_ID &&
      ENV.FIREBASE_MESSAGING_SENDER_ID &&
      ENV.FIREBASE_APP_ID &&
      ENV.FIREBASE_VAPID_KEY
  );
