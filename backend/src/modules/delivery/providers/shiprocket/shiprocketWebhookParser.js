const crypto = require('crypto');
const verifyWebhookSignature = (rawBody, headers = {}) => {
  const secret = process.env.SHIPROCKET_WEBHOOK_SECRET || '';
  const signature = headers['x-shiprocket-signature'];
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(String(signature)), Buffer.from(expected));
  } catch {
    return false;
  }
};

const parseWebhookPayload = (rawBody, headers = {}) => {
  const payload = typeof rawBody === 'string' ? JSON.parse(rawBody || '{}') : rawBody || {};
  return {
    eventId: headers['x-shiprocket-event-id'] || payload.event_id || payload.id || null,
    orderId: payload.order_id || payload.orderId || null,
    awbCode: payload.awb_code || payload.awbCode || null,
    currentStatus: payload.current_status || payload.status || null,
    location: payload.current_location || payload.location || null,
    eta: payload.eta || null,
    meta: payload,
  };
};

module.exports = {
  verifyWebhookSignature,
  parseWebhookPayload,
};
