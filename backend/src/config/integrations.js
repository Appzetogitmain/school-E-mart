const env = require('./env');

module.exports = Object.freeze({
  redis: Object.freeze({
    url: env.REDIS_URL || null,
    keyPrefix: env.REDIS_KEY_PREFIX,
    enabled: Boolean(env.REDIS_URL),
  }),
  outbox: Object.freeze({
    workerEnabled: env.OUTBOX_WORKER_ENABLED,
    pollIntervalMs: env.OUTBOX_POLL_INTERVAL_MS,
    batchSize: env.OUTBOX_BATCH_SIZE,
  }),
});
