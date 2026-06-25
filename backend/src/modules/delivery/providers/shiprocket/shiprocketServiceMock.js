const { SHIPROCKET_STATUS_MAP } = require('./shiprocketStatusMap');

const shiprocketServiceMock = {
  async createShipment() {
    return {
      shiprocketOrderId: 'MOCK-SR-ORDER-001',
      shiprocketShipmentId: 'MOCK-SR-SHIP-001',
      awbCode: 'MOCK-AWB-001',
      courierName: 'MockCourier',
      trackingUrl: 'https://mock.tracking/MOCK-AWB-001',
      labelUrl: 'https://mock.labels/MOCK-AWB-001.pdf',
    };
  },
  async cancelShipment() { return { cancelled: true }; },
  async getTrackingInfo() { return { currentStatus: 'OUT FOR DELIVERY', events: [] }; },
  async getETA() { return { etaMinutes: 15, etaTimestamp: new Date(Date.now() + 15 * 60_000) }; },
  async assignAWB() { return { awbCode: 'MOCK-AWB-001', courierName: 'MockCourier' }; },
  async generateLabel() { return { labelUrl: 'https://mock.labels/MOCK-AWB-001.pdf' }; },
  async schedulePickup() { return { pickupScheduled: true, scheduledAt: new Date() }; },
  mapStatus: (s) => SHIPROCKET_STATUS_MAP[s] || null,
  verifyWebhookSignature: () => true,
  parseWebhookPayload: (raw) => JSON.parse(raw),
  async refreshToken() {},
};

module.exports = { shiprocketServiceMock };
