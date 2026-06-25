const crypto = require('crypto');
const { verifyWebhookSignature, parseWebhookPayload } = require('../../src/modules/delivery/providers/shiprocket/shiprocketWebhookParser');

describe('shiprocketWebhookParser', () => {
  it('parseWebhookPayload extracts fields', () => {
    const parsed = parseWebhookPayload(JSON.stringify({ order_id: 'ORD-1', awb_code: 'AWB-1', current_status: 'DELIVERED' }), {});
    expect(parsed.orderId).toBe('ORD-1');
    expect(parsed.awbCode).toBe('AWB-1');
    expect(parsed.currentStatus).toBe('DELIVERED');
  });

  it('verifyWebhookSignature rejects invalid without secret', () => {
    const ok = verifyWebhookSignature('{"x":1}', { 'x-shiprocket-signature': 'abc' });
    expect(ok).toBe(false);
  });

  it('verifyWebhookSignature accepts valid signature when secret set', () => {
    process.env.SHIPROCKET_WEBHOOK_SECRET = 'test-secret';
    const body = '{"order_id":"ORD-1"}';
    const signature = crypto.createHmac('sha256', 'test-secret').update(body).digest('hex');
    const ok = verifyWebhookSignature(body, { 'x-shiprocket-signature': signature });
    expect(ok).toBe(true);
  });
});
