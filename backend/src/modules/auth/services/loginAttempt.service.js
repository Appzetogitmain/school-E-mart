const env = require('../../../config/env');
const { getStateStore } = require('../../../common/stateStore');

const LOCK_KEY_PREFIX = 'auth:login-lock:';

const buildKey = (identifier, ipAddress) => `${identifier}:${ipAddress || 'unknown'}`;

const getTtlSeconds = (lockedUntil) =>
  Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));

const loginAttemptTracker = {
  async isLocked(identifier, ipAddress) {
    const store = getStateStore();
    const key = `${LOCK_KEY_PREFIX}${buildKey(identifier, ipAddress)}`;
    const entry = await store.getJson(key);
    if (!entry?.lockedUntil) return false;

    if (entry.lockedUntil <= Date.now()) {
      await store.del(key);
      return false;
    }
    return true;
  },

  async getRemainingLockMs(identifier, ipAddress) {
    const store = getStateStore();
    const key = `${LOCK_KEY_PREFIX}${buildKey(identifier, ipAddress)}`;
    const entry = await store.getJson(key);
    if (!entry?.lockedUntil) return 0;
    return Math.max(0, entry.lockedUntil - Date.now());
  },

  async recordFailure(identifier, ipAddress) {
    const store = getStateStore();
    const key = `${LOCK_KEY_PREFIX}${buildKey(identifier, ipAddress)}`;
    const entry = (await store.getJson(key)) || { count: 0, lockedUntil: null };
    entry.count += 1;

    if (entry.count >= env.MAX_LOGIN_ATTEMPTS) {
      entry.lockedUntil = Date.now() + env.LOGIN_LOCKOUT_MINUTES * 60_000;
      entry.count = 0;
      await store.setJson(key, entry, getTtlSeconds(entry.lockedUntil));
      return entry;
    }

    await store.setJson(key, entry, env.LOGIN_LOCKOUT_MINUTES * 60);
    return entry;
  },

  async reset(identifier, ipAddress) {
    const store = getStateStore();
    await store.del(`${LOCK_KEY_PREFIX}${buildKey(identifier, ipAddress)}`);
  },
};

module.exports = loginAttemptTracker;
