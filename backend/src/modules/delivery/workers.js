const logger = require('../../common/logger');
const { deliveryShipmentQueue, deliveryCancellationQueue, deliveryWebhookQueue, deliveryTrackingQueue } = require('../../queues/deliveryQueues');
const { processShipmentCreationJob } = require('./processors/shipmentCreationProcessor');
const { processShipmentCancellationJob } = require('./processors/shipmentCancellationProcessor');
const { processWebhookJob } = require('./webhooks/shiprocketWebhookProcessor');
const { pollTrackingJob } = require('./tracking/shiprocketTrackingPoller');
const { shiprocketService } = require('./providers/shiprocket/shiprocketService');

let tokenRefreshTimer = null;

const registerDeliveryWorkers = () => {
  deliveryShipmentQueue.process(processShipmentCreationJob);
  deliveryCancellationQueue.process(processShipmentCancellationJob);
  deliveryWebhookQueue.process(processWebhookJob);
  deliveryTrackingQueue.process(pollTrackingJob);

  tokenRefreshTimer = setInterval(async () => {
    try {
      await shiprocketService.refreshToken();
    } catch (error) {
      logger.warn('Shiprocket proactive token refresh failed', { message: error.message });
    }
  }, 23 * 60 * 60 * 1000);
  tokenRefreshTimer.unref?.();
};

const stopDeliveryWorkers = () => {
  if (tokenRefreshTimer) clearInterval(tokenRefreshTimer);
  tokenRefreshTimer = null;
};

module.exports = {
  registerDeliveryWorkers,
  stopDeliveryWorkers,
};
