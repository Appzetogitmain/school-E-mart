const { NotFoundError, BadRequestError } = require('../../../common/errors');
const shipmentRepository = require('../repositories/shipment.repository');
const trackingRepository = require('../repositories/tracking.repository');
const orderService = require('./order.service');
const OrderShipment = require('../../../database/models/OrderShipment');
const { canTransition } = require('../utils/statusMachine');

const deliveryService = {
  async listShipments(orderId) {
    await orderService.getOrder(orderId);
    return shipmentRepository.findByOrder(orderId);
  },

  async assignShipment(orderId, vendorId, { courier, awbNumber, etaAt, items }, actor) {
    const order = await orderService.getOrder(orderId);
    const hasVendor = (order.vendorIds || []).some((id) => String(id) === String(vendorId));
    if (!hasVendor) throw new BadRequestError('Vendor not part of this order', null, 'VENDOR_NOT_IN_ORDER');

    let shipment = await shipmentRepository.findByOrderAndVendor(orderId, vendorId);
    if (!shipment) {
      shipment = await OrderShipment.create({
        orderId,
        vendorId,
        items: items || order.items
          .map((item, index) => ({ item, index }))
          .filter(({ item }) => String(item.vendorId) === String(vendorId))
          .map(({ index, item }) => ({ orderItemIndex: index, quantity: item.quantity })),
        status: 'placed',
      });
    }

    const updated = await OrderShipment.findByIdAndUpdate(
      shipment._id,
      {
        $set: {
          courier,
          awbNumber,
          etaAt: etaAt ? new Date(etaAt) : undefined,
          status: 'shipped',
        },
      },
      { new: true }
    ).lean();

    await trackingRepository.create({
      shipmentId: updated._id,
      status: 'shipped',
      notes: `Assigned to ${courier}`,
      actorRole: actor.role,
      actorId: actor.userId,
    });

    if (canTransition(order.orderStatus, 'shipped')) {
      await orderService.transitionStatus(orderId, { status: 'shipped', note: 'Shipment dispatched' }, actor);
    }

    return updated;
  },

  async updateShipmentStatus(orderId, shipmentId, { status, location, notes }, actor) {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment || String(shipment.orderId) !== String(orderId)) {
      throw new NotFoundError('Shipment not found', 'SHIPMENT_NOT_FOUND');
    }

    const updated = await OrderShipment.findByIdAndUpdate(
      shipmentId,
      {
        $set: {
          status,
          ...(location ? { lastLocation: location } : {}),
        },
      },
      { new: true }
    ).lean();

    await trackingRepository.create({
      shipmentId,
      status,
      location,
      notes,
      actorRole: actor.role,
      actorId: actor.userId,
    });

    const order = await orderService.getOrder(orderId);
    if (canTransition(order.orderStatus, status)) {
      await orderService.transitionStatus(orderId, { status, note: notes }, actor);
    }

    return updated;
  },

  async getTracking(orderId, shipmentId) {
    const shipment = await shipmentRepository.findById(shipmentId);
    if (!shipment || String(shipment.orderId) !== String(orderId)) {
      throw new NotFoundError('Shipment not found', 'SHIPMENT_NOT_FOUND');
    }
    const events = await trackingRepository.findByShipment(shipmentId);
    return { shipment, events };
  },
};

module.exports = deliveryService;
