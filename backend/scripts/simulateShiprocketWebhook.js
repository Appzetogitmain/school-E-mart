const axios = require('axios');
const crypto = require('crypto');

const SAMPLE_PAYLOADS = {
  'PICKUP COMPLETE': { awb_code: 'SR123456', current_status: 'PICKUP COMPLETE', order_id: 'ORD-001' },
  'OUT FOR DELIVERY': { awb_code: 'SR123456', current_status: 'OUT FOR DELIVERY', order_id: 'ORD-001' },
  DELIVERED: { awb_code: 'SR123456', current_status: 'DELIVERED', order_id: 'ORD-001' },
  CANCELLED: { awb_code: 'SR123456', current_status: 'CANCELLED', order_id: 'ORD-001' },
  'RTO INITIATED': { awb_code: 'SR123456', current_status: 'RTO INITIATED', order_id: 'ORD-001' },
};

async function simulate(orderId, statusKey) {
  const payload = { ...(SAMPLE_PAYLOADS[statusKey] || SAMPLE_PAYLOADS.DELIVERED), order_id: orderId };
  const body = JSON.stringify(payload);
  const eventId = `sim-${Date.now()}`;
  const signature = crypto
    .createHmac('sha256', process.env.SHIPROCKET_WEBHOOK_SECRET || '')
    .update(body)
    .digest('hex');

  await axios.post('http://localhost:5000/api/delivery/shiprocket/webhook', body, {
    headers: {
      'Content-Type': 'application/json',
      'x-shiprocket-signature': signature,
      'x-shiprocket-event-id': eventId,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Simulated [${statusKey}] for order ${orderId}`);
}

simulate(process.argv[2] || 'ORD-001', process.argv[3] || 'DELIVERED').catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error.message);
  process.exit(1);
});
