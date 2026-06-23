const Redis = require('ioredis');
const logger = require('../logger');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isClientUsable = (client) =>
  client && (client.status === 'ready' || client.status === 'connect');

class RedisStore {
  constructor({ url, keyPrefix, connectTimeoutMs, startupMaxAttempts, startupRetryDelayMs }) {
    this.url = url;
    this.keyPrefix = keyPrefix;
    this.connectTimeoutMs = connectTimeoutMs;
    this.startupMaxAttempts = startupMaxAttempts;
    this.startupRetryDelayMs = startupRetryDelayMs;
    this.client = null;
    this._errorHandler = null;
  }

  _key(key) {
    return `${this.keyPrefix}${key}`;
  }

  async _cleanupClient() {
    if (!this.client) return;

    const client = this.client;
    this.client = null;

    if (this._errorHandler) {
      client.removeListener('error', this._errorHandler);
      this._errorHandler = null;
    }

    try {
      if (client.status === 'ready' || client.status === 'connect') {
        await client.quit();
      } else {
        client.disconnect();
      }
    } catch {
      client.disconnect();
    }
  }

  async _connectOnce() {
    let connectError = null;

    const captureError = (error) => {
      if (!connectError) connectError = error;
      logger.error('Redis connection error', {
        message: error.message,
        code: error.code,
      });
    };

    this.client = new Redis(this.url, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectTimeout: this.connectTimeoutMs,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 20) {
          logger.error('Redis max reconnection attempts reached');
          return null;
        }
        return Math.min(times * 200, 3000);
      },
      reconnectOnError: (error) => {
        const retryable = ['READONLY', 'ECONNRESET', 'ETIMEDOUT', 'EPIPE'];
        return retryable.some((code) => error.message.includes(code));
      },
    });

    this._errorHandler = captureError;
    this.client.on('error', captureError);

    try {
      await this.client.connect();
      await this.client.ping();
    } catch (error) {
      await this._cleanupClient();
      throw connectError || error;
    }
  }

  _maskUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.password) parsed.password = '***';
      return parsed.toString();
    } catch {
      return '[invalid-redis-url]';
    }
  }

  async connect() {
    if (isClientUsable(this.client)) {
      if (this.client.status === 'ready') return this.client;
      await this.client.ping();
      return this.client;
    }

    if (this.client) {
      await this._cleanupClient();
    }

    let lastError = null;

    for (let attempt = 1; attempt <= this.startupMaxAttempts; attempt += 1) {
      try {
        await this._connectOnce();
        logger.info('Redis state store connected', {
          url: this._maskUrl(this.url),
          attempt,
        });
        return this.client;
      } catch (error) {
        lastError = error;
        const isLastAttempt = attempt === this.startupMaxAttempts;

        logger.warn('Redis connection attempt failed', {
          attempt,
          maxAttempts: this.startupMaxAttempts,
          message: error.message,
          code: error.code,
          url: this._maskUrl(this.url),
          willRetry: !isLastAttempt,
        });

        if (isLastAttempt) break;
        await delay(this.startupRetryDelayMs);
      }
    }

    const rootMessage = lastError?.message || 'unknown error';
    throw new Error(
      `Redis connection failed after ${this.startupMaxAttempts} attempt(s): ${rootMessage}`,
      { cause: lastError }
    );
  }

  _assertConnected() {
    if (!isClientUsable(this.client)) {
      throw new Error('Redis state store is not connected');
    }
  }

  async get(key) {
    this._assertConnected();
    return this.client.get(this._key(key));
  }

  async set(key, value, ttlSeconds = null) {
    this._assertConnected();
    const redisKey = this._key(key);
    if (ttlSeconds && ttlSeconds > 0) {
      return this.client.set(redisKey, value, 'EX', ttlSeconds);
    }
    return this.client.set(redisKey, value);
  }

  async del(key) {
    this._assertConnected();
    return this.client.del(this._key(key));
  }

  async exists(key) {
    this._assertConnected();
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
    await this._cleanupClient();
    logger.info('Redis state store disconnected');
  }

  get type() {
    return 'redis';
  }
}

module.exports = RedisStore;
