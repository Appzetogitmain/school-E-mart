class MemoryStore {
  constructor() {
    this.store = new Map();
    this.expirations = new Map();
  }

  _purgeIfExpired(key) {
    const expiresAt = this.expirations.get(key);
    if (expiresAt && expiresAt <= Date.now()) {
      this.store.delete(key);
      this.expirations.delete(key);
      return true;
    }
    return false;
  }

  async get(key) {
    this._purgeIfExpired(key);
    const value = this.store.get(key);
    return value === undefined ? null : value;
  }

  async set(key, value, ttlSeconds = null) {
    this.store.set(key, value);
    if (ttlSeconds && ttlSeconds > 0) {
      this.expirations.set(key, Date.now() + ttlSeconds * 1000);
    } else {
      this.expirations.delete(key);
    }
    return 'OK';
  }

  async del(key) {
    this.store.delete(key);
    this.expirations.delete(key);
    return 1;
  }

  async exists(key) {
    this._purgeIfExpired(key);
    return this.store.has(key) ? 1 : 0;
  }

  async getJson(key) {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async setJson(key, value, ttlSeconds = null) {
    return this.set(key, JSON.stringify(value), ttlSeconds);
  }

  async connect() {}

  async disconnect() {
    this.store.clear();
    this.expirations.clear();
  }

  get type() {
    return 'memory';
  }
}

module.exports = MemoryStore;
