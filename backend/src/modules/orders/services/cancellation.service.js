const { NotFoundError, BadRequestError } = require('../../../common/errors');
const orderService = require('./order.service');
const inventoryService = require('./inventory.service');
const paymentService = require('./payment.service');
const { runAtomic } = require('../utils/atomic');
const {
  canCustomerCancel,
  canAdminCancel,
  canVendorCancel,
} = require('../utils/statusMachine');
const Order = require('../../../database/models/Order');
const OrderShipment = require('../../../database/models/OrderShipment');
const { deliveryCancellationQueue } = require('../../../queues/deliveryQueues');

const cancellationService = {
  async cancelOrder(orderId, { reason, cancelledBy }, { role = 'customer' } = {}) {
    const order = await orderService.getOrder(orderId);

    const canCancel =
      role === 'admin'
        ? canAdminCancel(order.orderStatus)
        : role === 'vendor'
          ? canVendorCancel(order.orderStatus)
          : canCustomerCancel(order.orderStatus);
    if (!canCancel) {
      throw new BadRequestError(
        `Order cannot be cancelled in status ${order.orderStatus}`,
        null,
        'CANCELLATION_NOT_ALLOWED'
      );
    }

    return runAtomic(async (session) => {
      const opts = session ? { session } : {};

      await inventoryService.restoreStock(order.items, session);

      const updated = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            orderStatus: 'cancelled',
            paymentStatus: order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus,
            cancellation: {
              at: new Date(),
              reason,
              byUserId: cancelledBy,
            },
          },
          $push: {
            statusHistory: {
              status: 'cancelled',
              at: new Date(),
              note: reason,
              byUserId: cancelledBy,
            },
          },
        },
        { new: true, ...opts }
      ).lean();

      await OrderShipment.updateMany(
        { orderId },
        { $set: { status: 'cancelled' } },
        opts
      );

      if (order.paymentStatus === 'paid' || order.paymentStatus === 'authorized') {
        try {
          await paymentService.initiateRefund(
            orderId,
            { amountPaise: order.totalPaise, reason: reason || 'Order cancelled' },
            { actorUserId: cancelledBy },
            { session }
          );
        } catch {
          // refund initiation is best-effort when payment record missing
        }
      }

      await deliveryCancellationQueue.add({
        orderId: String(order.orderNumber),
        orderMongoId: order._id,
        shiprocketOrderId: order.orderNumber,
      });

      return updated;
    });
  },
};

module.exports = cancellationService;
