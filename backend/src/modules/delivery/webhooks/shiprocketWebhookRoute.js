const express = require('express');
const logger = require('../../../common/logger');
const idempotencyService = require('../../../services/idempotencyService');
const { deliveryWebhookQueue } = require('../../../queues/deliveryQueues');
const { shiprocketService } = require('../providers/shiprocket/shiprocketService');

const router = express.Router();

router.post('/shiprocket/webhook', async (req, res) => {
  const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
  const valid = shiprocketService.verifyWebhookSignature(rawBody, req.headers);
  if (!valid) {
    logger.warn('Shiprocket webhook signature invalid', { domain: 'delivery' });
    return res.status(401).end();
  }

  const eventId = req.headers['x-shiprocket-event-id'] || `missing:${Date.now()}`;
  const idemKey = `webhook:shiprocket:${eventId}`;
  const duplicate = await idempotencyService.check(idemKey);
  if (duplicate) return res.status(200).end();

  await deliveryWebhookQueue.add({
    rawBody: rawBody.toString(),
    headers: req.headers,
  });
  await idempotencyService.store(idemKey, true, 86400);
  return res.status(200).end();
});

module.exports = router;
