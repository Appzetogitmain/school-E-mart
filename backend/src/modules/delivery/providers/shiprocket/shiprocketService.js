const logger = require('../../../../common/logger');
const { shiprocketClient } = require('./shiprocketClient');
const { mapShiprocketStatus } = require('./shiprocketStatusMap');
const webhookParser = require('./shiprocketWebhookParser');
const config = require('../../../../config');

class ShiprocketService {
  _missingCredentialsResponse(operation) {
    logger.warn('Shiprocket operation skipped: missing credentials', { domain: 'delivery', provider: 'shiprocket', operation });
    return null;
  }

  _hasCredentials() {
    return Boolean(config.env.SHIPROCKET_EMAIL && config.env.SHIPROCKET_PASSWORD);
  }

  async createShipment(context) {
    if (!this._hasCredentials()) return this._missingCredentialsResponse('createShipment');
    const order = await shiprocketClient.createOrder({
      order_id: context.orderId,
      order_date: new Date().toISOString(),
      pickup_location: 'Primary',
      billing_customer_name: context.drop?.name || 'Customer',
      billing_phone: context.drop?.phone || '9999999999',
      billing_address: context.drop?.address || '',
      billing_pincode: context.drop?.pincode || '',
      shipping_is_billing: true,
      order_items: (context.items || []).map((item) => ({
        name: item.name,
        units: item.qty,
        selling_price: item.value,
        weight: item.weight || 0.5,
      })),
      payment_method: context.paymentMode || 'PREPAID',
      sub_total: context.totalValue || 0,
      weight: context.weight || 0.5,
    });
    const shiprocketOrderId = order?.order_id || order?.orderId || context.orderId;
    const shipment = await shiprocketClient.createShipment(shiprocketOrderId);
    const shiprocketShipmentId = shipment?.shipment_id || shipment?.shipmentId || null;
    const awb = shiprocketShipmentId ? await this.assignAWB(shiprocketShipmentId) : null;
    const pickup = shiprocketShipmentId ? await this.schedulePickup(shiprocketShipmentId) : null;
    const label = shiprocketShipmentId ? await this.generateLabel(shiprocketShipmentId) : null;
    return {
      shiprocketOrderId,
      shiprocketShipmentId,
      awbCode: awb?.awbCode || null,
      courierName: awb?.courierName || null,
      trackingUrl: awb?.trackingUrl || null,
      labelUrl: label?.labelUrl || null,
      pickupScheduled: Boolean(pickup?.pickupScheduled),
      pickupScheduledAt: pickup?.scheduledAt || null,
    };
  }

  async cancelShipment(context) {
    if (!this._hasCredentials()) return this._missingCredentialsResponse('cancelShipment');
    await shiprocketClient.cancelOrder(context.shiprocketOrderId || context.orderId);
    return { cancelled: true };
  }

  async getTrackingInfo(context) {
    if (!this._hasCredentials()) return this._missingCredentialsResponse('getTrackingInfo');
    const payload = await shiprocketClient.trackShipment(context.awbCode);
    return {
      currentStatus: payload?.tracking_data?.shipment_track?.[0]?.current_status || null,
      location: payload?.tracking_data?.shipment_track?.[0]?.current_location || null,
      eta: payload?.tracking_data?.etd || null,
      events: payload?.tracking_data?.shipment_track_activities || [],
    };
  }

  async getETA(context) {
    const tracking = await this.getTrackingInfo(context);
    return { etaMinutes: null, etaTimestamp: tracking?.eta ? new Date(tracking.eta) : null };
  }

  async assignAWB(shipmentId) {
    if (!this._hasCredentials()) return this._missingCredentialsResponse('assignAWB');
    const res = await shiprocketClient.assignAWB(shipmentId);
    return {
      awbCode: res?.response?.data?.awb_code || null,
      courierName: res?.response?.data?.courier_name || null,
      trackingUrl: res?.response?.data?.tracking_url || null,
    };
  }

  async generateLabel(shipmentId) {
    if (!this._hasCredentials()) return this._missingCredentialsResponse('generateLabel');
    const res = await shiprocketClient.generateLabel(shipmentId);
    return { labelUrl: res?.label_url || res?.response?.label_url || null };
  }

  async schedulePickup(shipmentId) {
    if (!this._hasCredentials()) return this._missingCredentialsResponse('schedulePickup');
    await shiprocketClient.schedulePickup(shipmentId);
    return { pickupScheduled: true, scheduledAt: new Date() };
  }

  mapStatus(status) { return mapShiprocketStatus(status); }
  parseWebhookPayload(rawBody, headers) { return webhookParser.parseWebhookPayload(rawBody, headers); }
  verifyWebhookSignature(rawBody, headers) { return webhookParser.verifyWebhookSignature(rawBody, headers); }
  async refreshToken() { await shiprocketClient.refreshToken(); }

  emitDeliveryBroadcastForSeller() {}
  retractDeliveryBroadcastForOrder() {}
  emitReturnBroadcastForCustomer() {}
  emitToDelivery() {}
}

module.exports = {
  ShiprocketService,
  shiprocketService: new ShiprocketService(),
};
