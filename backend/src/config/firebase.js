const admin = require('firebase-admin');
const env = require('./env');
const logger = require('../common/logger');

let firebaseApp = null;

const isFirebaseConfigured = () =>
  Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY);

const getFirebaseApp = () => {
  if (!isFirebaseConfigured()) return null;

  if (!firebaseApp) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    });
    logger.info('Firebase Admin SDK initialized', { projectId: env.FIREBASE_PROJECT_ID });
  }

  return firebaseApp;
};

const getMessaging = () => {
  const app = getFirebaseApp();
  return app ? admin.messaging(app) : null;
};

module.exports = {
  isFirebaseConfigured,
  getFirebaseApp,
  getMessaging,
};
