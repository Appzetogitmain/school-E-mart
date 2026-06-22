const OutboxEvent = require('../../database/models/OutboxEvent');
const logger = require('../../common/logger');

const publishOutboxEvent = async (
  { aggregateType, aggregateId, eventType, payload },
  session = null
) => {
  const options = session ? { session } : undefined;
  const [event] = await OutboxEvent.create(
    [
      {
        aggregateType,
        aggregateId,
        eventType,
        payload,
        createdAt: new Date(),
      },
    ],
    options
  );
  return event;
};

const DEFAULT_HANDLERS = {
  'notification.send': async (event) => {
    logger.debug('Outbox handler not implemented', {
      eventType: event.eventType,
      aggregateType: event.aggregateType,
      aggregateId: event.aggregateId?.toString(),
    });
  },
};

const processOutboxBatch = async (batchSize = 20, handlers = DEFAULT_HANDLERS) => {
  const events = await OutboxEvent.find({ processedAt: null })
    .sort({ createdAt: 1 })
    .limit(batchSize)
    .lean();

  if (!events.length) return 0;

  let processed = 0;

  for (const event of events) {
    try {
      const handler = handlers[event.eventType];
      if (handler) {
        await handler(event);
      } else {
        logger.warn('No outbox handler registered', { eventType: event.eventType });
      }

      await OutboxEvent.updateOne(
        { _id: event._id },
        { $set: { processedAt: new Date(), lastError: null } }
      );
      processed += 1;
    } catch (error) {
      await OutboxEvent.updateOne(
        { _id: event._id },
        {
          $inc: { attempts: 1 },
          $set: { lastError: error.message },
        }
      );
      logger.error('Outbox event processing failed', {
        eventId: event._id.toString(),
        eventType: event.eventType,
        message: error.message,
      });
    }
  }

  return processed;
};

const startOutboxWorker = ({ pollIntervalMs = 5000, batchSize = 20, handlers } = {}) => {
  logger.info('Outbox worker started', { pollIntervalMs, batchSize });

  const timer = setInterval(() => {
    processOutboxBatch(batchSize, handlers).catch((error) => {
      logger.error('Outbox worker tick failed', { message: error.message });
    });
  }, pollIntervalMs);

  timer.unref();
  return timer;
};

const stopOutboxWorker = (timer) => {
  if (timer) clearInterval(timer);
};

module.exports = {
  publishOutboxEvent,
  processOutboxBatch,
  startOutboxWorker,
  stopOutboxWorker,
};
