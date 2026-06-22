const Redis = require('ioredis');
const logger = require('../logger');

class RedisStore {
  constructor({ url, keyPrefix }) {
    this.url = url;
    this.keyPrefix = keyPrefix;
    this.client = null;
  }

  _key(key) {
    return `${this.keyPrefix}${key}`;
  }

  async connect() {
    if (this.client) return this.client;

    this.client = new Redis(this.url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.client.on('error', (error) => {
      logger.error('Redis connection error', { message: error.message });
    });

    await this.client.connect();
    logger.info('Redis state store connected');
    return this.client;
  }

  async get(key) {
    return this.client.get(this._key(key));
  }

  async set(key, value, ttlSeconds = null) {
    const redisKey = this._key(key);
    if (ttlSeconds && ttlSeconds > 0) {
      return this.client.set(redisKey, value, 'EX', ttlSeconds);
    }
    return this.client.set(redisKey, value);
  }

  async del(key) {
    return this.client.del(this._key(key));
  }

  async exists(key) {
    return this.client.exists(this._key(key));
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

  async disconnect() {
    if (!this.client) return;
    await this.client.quit();
    this.client = null;
    logger.info('Redis state store disconnected');
  }

  get type() {
    return 'redis';
  }
}

module.exports = RedisStore;
