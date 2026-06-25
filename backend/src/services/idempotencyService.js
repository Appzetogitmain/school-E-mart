const { getStateStore } = require('../common/stateStore');

const idempotencyService = {
  async check(key) {
    const store = getStateStore();
    return store.getJson(`idempotency:${key}`);
  },

  async store(key, result, ttlSeconds = 24 * 60 * 60) {
    const store = getStateStore();
    await store.setJson(`idempotency:${key}`, { result, storedAt: new Date().toISOString() }, ttlSeconds);
  },
};

module.exports = idempotencyService;
