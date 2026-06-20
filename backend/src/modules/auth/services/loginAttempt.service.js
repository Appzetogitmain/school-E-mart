const env = require('../../../config/env');

const attempts = new Map();

const buildKey = (identifier, ipAddress) => `${identifier}:${ipAddress || 'unknown'}`;

const loginAttemptTracker = {
  isLocked(identifier, ipAddress) {
    const entry = attempts.get(buildKey(identifier, ipAddress));
    if (!entry?.lockedUntil) return false;
    if (entry.lockedUntil <= Date.now()) {
      attempts.delete(buildKey(identifier, ipAddress));
      return false;
    }
    return true;
  },

  getRemainingLockMs(identifier, ipAddress) {
    const entry = attempts.get(buildKey(identifier, ipAddress));
    if (!entry?.lockedUntil) return 0;
    return Math.max(0, entry.lockedUntil - Date.now());
  },

  recordFailure(identifier, ipAddress) {
    const key = buildKey(identifier, ipAddress);
    const entry = attempts.get(key) || { count: 0, lockedUntil: null };
    entry.count += 1;

    if (entry.count >= env.MAX_LOGIN_ATTEMPTS) {
      entry.lockedUntil = Date.now() + env.LOGIN_LOCKOUT_MINUTES * 60_000;
      entry.count = 0;
    }

    attempts.set(key, entry);
    return entry;
  },

  reset(identifier, ipAddress) {
    attempts.delete(buildKey(identifier, ipAddress));
  },
};

module.exports = loginAttemptTracker;
