const mongoose = require('mongoose');
require('../config/env');
const databaseConfig = require('../config/database');
const logger = require('../common/logger');
const { DATABASE_STATE } = require('../constants/enums');

const MONGO_URI_PATTERN = /^mongodb(\+srv)?:\/\//i;

const resolveConnectionUri = (uri) => uri ?? databaseConfig.uri;

const validateConnectionUri = (uri) => {
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    const error = new Error(
      'MongoDB connection URI is not configured. Set MONGODB_URI or MONGO_URI in backend/.env.'
    );
    error.code = 'MONGODB_URI_MISSING';
    throw error;
  }

  const normalizedUri = uri.trim();

  if (!MONGO_URI_PATTERN.test(normalizedUri)) {
    const error = new Error(
      'MongoDB connection URI is invalid. Expected a mongodb:// or mongodb+srv:// connection string.'
    );
    error.code = 'MONGODB_URI_INVALID';
    throw error;
  }

  return normalizedUri;
};

const READY_STATE = {
  [DATABASE_STATE.DISCONNECTED]: 'disconnected',
  [DATABASE_STATE.CONNECTED]: 'connected',
  [DATABASE_STATE.CONNECTING]: 'connecting',
  [DATABASE_STATE.DISCONNECTING]: 'disconnecting',
};

let listenersRegistered = false;

const registerConnectionEvents = () => {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('connected', () => {
    logger.info('MongoDB connected', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected. Mongoose will attempt to reconnect automatically.');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected', {
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    });
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', {
      message: error.message,
      stack: error.stack,
    });
  });
};

const connectDB = async (uri) => {
  registerConnectionEvents();

  if (mongoose.connection.readyState === DATABASE_STATE.CONNECTED) {
    logger.debug('MongoDB connection already established');
    return mongoose.connection;
  }

  let connectionUri;

  try {
    connectionUri = validateConnectionUri(resolveConnectionUri(uri));
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      message: error.message,
      code: error.code,
      mongoUriSource: process.env.MONGODB_URI
        ? 'MONGODB_URI'
        : process.env.MONGO_URI
          ? 'MONGO_URI'
          : 'none',
    });
    throw error;
  }

  try {
    await mongoose.connect(connectionUri, databaseConfig.options);
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

const disconnectDB = async () => {
  if (mongoose.connection.readyState === DATABASE_STATE.DISCONNECTED) {
    return;
  }

  await mongoose.connection.close();
  logger.info('MongoDB connection closed gracefully');
};

const getDatabaseStatus = () => {
  const { readyState, host, name } = mongoose.connection;

  return {
    status: READY_STATE[readyState] || 'unknown',
    readyState,
    connected: readyState === DATABASE_STATE.CONNECTED,
    host: host || null,
    name: name || null,
  };
};

module.exports = {
  connectDB,
  disconnectDB,
  getDatabaseStatus,
};
