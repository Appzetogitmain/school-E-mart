const mongoose = require('mongoose');
const databaseConfig = require('../config/database');
const logger = require('../common/logger');
const { DATABASE_STATE } = require('../constants/enums');

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

const connectDB = async (uri = databaseConfig.uri) => {
  registerConnectionEvents();

  if (mongoose.connection.readyState === DATABASE_STATE.CONNECTED) {
    logger.debug('MongoDB connection already established');
    return mongoose.connection;
  }

  try {
    await mongoose.connect(uri, databaseConfig.options);
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
