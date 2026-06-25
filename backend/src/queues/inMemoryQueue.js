const logger = require('../common/logger');

class InMemoryQueue {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
    this._handler = null;
    this._jobs = new Map();
  }

  process(handler) {
    this._handler = handler;
  }

  async add(data, opts = {}) {
    const id = opts.jobId || `${this.name}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    const job = {
      id,
      data,
      opts,
      attemptsMade: 0,
      async remove() {},
    };
    this._jobs.set(id, job);
    if (this._handler) {
      setImmediate(async () => {
        try {
          await this._handler(job);
          this._jobs.delete(id);
        } catch (error) {
          logger.error('In-memory queue job failed', { queue: this.name, jobId: id, message: error.message });
        }
      });
    }
    return job;
  }

  async getJob(id) {
    return this._jobs.get(id) || null;
  }
}

module.exports = InMemoryQueue;
