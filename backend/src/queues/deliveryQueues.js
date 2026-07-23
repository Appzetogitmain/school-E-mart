const config = require('../config');
const logger = require('../common/logger');
const InMemoryQueue = require('./inMemoryQueue');

let Bull;
try {
  Bull = require('bull');
} catch {
  Bull = null;
}

let warnedInMemory = false;

const createQueue = (name, defaultJobOptions) => {
  if (Bull && config.integrations.redis.enabled) {
    return new Bull(name, {
      redis: config.integrations.redis.url,
      defaultJobOptions,
    });
  }
  if (!warnedInMemory) {
    logger.warn('Delivery queues running in in-memory mode');
    warnedInMemory = true;
  }
  return new InMemoryQueue(name, { defaultJobOptions });
};

const deliveryShipmentQueue = createQueue('delivery:shipment', {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 200,
});

const deliveryCancellationQueue = createQueue('delivery:cancellation', {
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 200,
});

const deliveryWebhookQueue = createQueue('delivery:webhook', {
  attempts: 5,
  backoff: { type: 'fixed', delay: 2000 },
  removeOnComplete: 200,
  removeOnFail: 500,
});

const deliveryTrackingQueue = createQueue('delivery:tracking', {
  attempts: 3,
  backoff: { type: 'exponential', delay: 10_000 },
  removeOnComplete: 50,
  removeOnFail: 100,
});

module.exports = {
  deliveryShipmentQueue,
  deliveryCancellationQueue,
  deliveryWebhookQueue,
  deliveryTrackingQueue,
};
