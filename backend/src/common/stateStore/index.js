const config = require('../../config');
const logger = require('../logger');
const MemoryStore = require('./memoryStore');
const RedisStore = require('./redisStore');

let storeInstance = null;

const createStateStore = () => {
  const { redis } = config.integrations;

  if (redis.enabled) {
    return new RedisStore({
      url: redis.url,
      keyPrefix: redis.keyPrefix,
      connectTimeoutMs: redis.connectTimeoutMs,
      startupMaxAttempts: redis.startupMaxAttempts,
      startupRetryDelayMs: redis.startupRetryDelayMs,
    });
  }

  if (config.env.NODE_ENV === 'production') {
    logger.warn(
      'REDIS_URL is not configured. Using in-memory state store — login lockout and OTP cooldown will not be shared across instances.'
    );
  }

  return new MemoryStore();
};

const getStateStore = () => {
  if (!storeInstance) {
    storeInstance = createStateStore();
  }
  return storeInstance;
};

const connectStateStore = async () => {
  const store = getStateStore();
  await store.connect();
  logger.info('State store ready', { type: store.type });
  return store;
};

const disconnectStateStore = async () => {
  if (!storeInstance) return;
  await storeInstance.disconnect();
  storeInstance = null;
};

module.exports = {
  getStateStore,
  connectStateStore,
  disconnectStateStore,
};
