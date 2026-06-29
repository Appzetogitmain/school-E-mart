export const ENV = {
  API_URL: import.meta.env.VITE_API_URL || '/api/v1',
  BASE_URL: import.meta.env.VITE_BASE_URL || 'http://localhost:5173',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
  APP_NAME: 'School E-Mart',
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',
  FIREBASE_MEASUREMENT_ID: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  FIREBASE_VAPID_KEY: import.meta.env.VITE_FIREBASE_VAPID_KEY || '',
};

export const isFirebaseConfigured = () =>
  Boolean(
    ENV.FIREBASE_API_KEY &&
      ENV.FIREBASE_PROJECT_ID &&
      ENV.FIREBASE_MESSAGING_SENDER_ID &&
      ENV.FIREBASE_APP_ID &&
      ENV.FIREBASE_VAPID_KEY
  );
