const axios = require('axios');
const config = require('../../../../config');
const logger = require('../../../../common/logger');
const { getStateStore } = require('../../../../common/stateStore');
const ShiprocketTokenStore = require('../../../../database/models/ShiprocketTokenStore');

class ShiprocketError extends Error {
  constructor(code, message, details = null) {
    super(message);
    this.name = 'ShiprocketError';
    this.code = code;
    this.details = details;
  }
}

class ShiprocketClient {
  constructor() {
    this.baseUrl = config.env.SHIPROCKET_BASE_URL;
  }

  async checkRateLimit() {
    const store = getStateStore();
    const key = 'ratelimit:shiprocket';
    const ttlSeconds = 60;
    const data = (await store.getJson(key)) || { count: 0, expiresAt: Date.now() + ttlSeconds * 1000 };
    if (Date.now() > data.expiresAt) {
      data.count = 0;
      data.expiresAt = Date.now() + ttlSeconds * 1000;
    }
    data.count += 1;
    await store.setJson(key, data, ttlSeconds);
    if (data.count > config.env.SHIPROCKET_RPM_LIMIT) {
      throw new ShiprocketError('RATE_LIMITED', 'Shiprocket rate limit exceeded');
    }
  }

  hasCredentials() {
    return Boolean(config.env.SHIPROCKET_EMAIL && config.env.SHIPROCKET_PASSWORD);
  }

  async getToken() {
    const stored = await ShiprocketTokenStore.findOne().lean();
    if (stored && new Date(stored.expiresAt) > new Date()) return stored.accessToken;
    return this.refreshToken();
  }

  async refreshToken() {
    if (!this.hasCredentials()) {
      throw new ShiprocketError('MISSING_CREDENTIALS', 'Shiprocket credentials are not configured');
    }
    const res = await axios.post(`${this.baseUrl}/auth/login`, {
      email: config.env.SHIPROCKET_EMAIL,
      password: config.env.SHIPROCKET_PASSWORD,
    });
    const token = res?.data?.token;
    if (!token) throw new ShiprocketError('TOKEN_MISSING', 'Shiprocket login did not return token');
    await ShiprocketTokenStore.findOneAndUpdate(
      {},
      { accessToken: token, expiresAt: new Date(Date.now() + config.env.SHIPROCKET_TOKEN_REFRESH_MS), updatedAt: new Date() },
      { upsert: true, new: true }
    );
    return token;
  }

  async request(method, path, data) {
    await this.checkRateLimit();
    const token = await this.getToken();
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${path}`,
        data,
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        await ShiprocketTokenStore.deleteOne({});
        const freshToken = await this.refreshToken();
        const retried = await axios({
          method,
          url: `${this.baseUrl}${path}`,
          data,
          headers: { Authorization: `Bearer ${freshToken}` },
        });
        return retried.data;
      }
      logger.error('Shiprocket request failed', { method, path, message: error.message, status: error.response?.status });
      throw new ShiprocketError('REQUEST_FAILED', error.message, error.response?.data || null);
    }
  }

  async createOrder(payload) { return this.request('POST', '/orders/create/adhoc', payload); }
  async createShipment(orderId) { return this.request('POST', '/shipments', { order_id: orderId }); }
  async assignAWB(shipmentId) { return this.request('POST', '/courier/assign/awb', { shipment_id: shipmentId }); }
  async schedulePickup(shipmentId) { return this.request('POST', '/courier/generate/pickup', { shipment_id: [shipmentId] }); }
  async generateLabel(shipmentId) { return this.request('POST', '/courier/generate/label', { shipment_id: [shipmentId] }); }
  async cancelOrder(orderId) { return this.request('POST', '/orders/cancel', { ids: [orderId] }); }
  async trackShipment(awbCode) { return this.request('GET', `/courier/track/awb/${awbCode}`); }
  async ping() { return this.request('GET', '/settings/company/selfinfo'); }
}

module.exports = {
  ShiprocketClient,
  ShiprocketError,
  shiprocketClient: new ShiprocketClient(),
};
