const env = require('./env');

module.exports = Object.freeze({
  redis: Object.freeze({
    url: env.REDIS_URL || null,
    keyPrefix: env.REDIS_KEY_PREFIX,
    enabled: Boolean(env.REDIS_URL),
    connectTimeoutMs: env.REDIS_CONNECT_TIMEOUT_MS,
    startupMaxAttempts: env.REDIS_STARTUP_MAX_ATTEMPTS,
    startupRetryDelayMs: env.REDIS_STARTUP_RETRY_DELAY_MS,
  }),
  outbox: Object.freeze({
    workerEnabled: env.OUTBOX_WORKER_ENABLED,
    pollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
    batchSize: env.OUTBOX_BATCH_SIZE,
  }),
  firebase: Object.freeze({
    enabled: Boolean(env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY),
    projectId: env.FIREBASE_PROJECT_ID,
  }),
});
