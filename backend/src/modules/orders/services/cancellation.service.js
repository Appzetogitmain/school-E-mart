const { BadRequestError } = require('../../../common/errors');
const orderService = require('./order.service');
const inventoryService = require('./inventory.service');
const paymentService = require('./payment.service');
const paymentRepository = require('../repositories/payment.repository');
const walletService = require('../../wallet/services/wallet.service');
const { runAtomic } = require('../utils/atomic');
const {
  canCustomerCancel,
  canAdminCancel,
  canVendorCancel,
} = require('../utils/statusMachine');
const Order = require('../../../database/models/Order');
const OrderShipment = require('../../../database/models/OrderShipment');
const logger = require('../../../common/logger');
const { deliveryCancellationQueue } = require('../../../queues/deliveryQueues');
const { triggerService } = require('../../../services/notification');

const cancellationService = {
  /**
   * Cancel an order and start returning the customer's money.
   *
   * The cancellation itself (status, stock, shipments) is transactional. The
   * refund is not, and deliberately runs after the transaction commits: an
   * external call that moves real money must never be inside a transaction that
   * can later abort, or the gateway and the database end up disagreeing about
   * whether the customer was paid back.
   *
   * The order is no longer marked 'refunded' up front. It says 'refund_pending'
   * until the gateway confirms the money has actually settled — previously the
   * status was written as 'refunded' in the same update that cancelled the
   * order, before the refund had even been attempted, and any gateway failure
   * was swallowed by a bare catch. That is why production held orders marked
   * fully refunded whose refunds Razorpay had never processed.
   */
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

    const walletApplied = order.walletAmountPaise || 0;

    // What has actually been collected, read from the Payment rows rather than
    // assumed from the order total. An order can be cancelled before its payment
    // ever captured, in which case there is nothing to refund at all.
    const capturedPaise = await paymentRepository.sumCapturedForOrder(orderId);

    // A COD payment is recorded as captured when the order is placed, but the
    // courier does not hand over the cash until delivery — so until the order is
    // marked paid, no money exists to send back. Treating that placeholder
    // capture as collected money would raise a refund for cash nobody ever paid.
    const collectedPaise =
      order.paymentMethod === 'cod' && order.paymentStatus !== 'paid' ? 0 : capturedPaise;

    const gatewayRefundPaise = Math.min(
      collectedPaise,
      Math.max(0, (order.totalPaise || 0) - walletApplied)
    );
    const refundDue = gatewayRefundPaise > 0;

    const updated = await runAtomic(async (session) => {
      const opts = session ? { session } : {};

      await inventoryService.restoreStock(order.items, session);

      const result = await Order.findByIdAndUpdate(
        orderId,
        {
          $set: {
            orderStatus: 'cancelled',
            // Only claim a refund state the money supports. 'refund_pending'
            // means we have asked, or are about to ask, the gateway — not that
            // the customer has been paid back.
            paymentStatus: refundDue ? 'refund_pending' : order.paymentStatus,
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

      await OrderShipment.updateMany({ orderId }, { $set: { status: 'cancelled' } }, opts);

      return result;
    });

    // ---- Everything below is outside the transaction, on purpose. ----

    // The wallet-funded portion goes straight back to the wallet; no gateway is
    // involved, so it settles immediately.
    if (walletApplied > 0) {
      try {
        await walletService.postTransaction(order.userId, {
          type: 'credit',
          category: 'order_refund',
          amountPaise: walletApplied,
          reference: { kind: 'Order', id: order._id },
          description: `Wallet refund for cancelled order ${order.orderNumber}`,
        });
      } catch (walletError) {
        // Logged rather than discarded: a wallet credit that never happened is
        // money the customer is owed, and it has to be findable afterwards.
        logger.error('Cancellation: wallet refund failed', {
          orderId: String(orderId),
          orderNumber: order.orderNumber,
          amountPaise: walletApplied,
          error: walletError.message,
        });
      }
    }

    let refund = null;
    let refundError = null;
    if (refundDue) {
      try {
        refund = await paymentService.initiateRefund(orderId, {
          amountPaise: gatewayRefundPaise,
          reason: reason || 'Order cancelled',
          actorUserId: cancelledBy,
        });
      } catch (error) {
        // The order stays cancelled — that part is done and the stock is back —
        // but its payment status stays 'refund_pending' and the payment is
        // flagged as a mismatch by initiateRefund, so the money owed shows up in
        // the admin reconciliation queue instead of disappearing.
        refundError = error.message;
        logger.error('Cancellation: gateway refund failed', {
          orderId: String(orderId),
          orderNumber: order.orderNumber,
          amountPaise: gatewayRefundPaise,
          error: error.message,
        });
      }
    }

    try {
      await deliveryCancellationQueue.add({
        orderId: String(order.orderNumber),
        orderMongoId: order._id,
        shiprocketOrderId: order.orderNumber,
      });
    } catch (queueError) {
      logger.warn('Cancellation: courier cancellation could not be queued', {
        orderNumber: order.orderNumber,
        error: queueError.message,
      });
    }

    triggerService.notifyOrderCancelled(updated, role);

    const fresh = await Order.findById(orderId).lean();
    return { ...(fresh || updated), refund, refundError };
  },
};

module.exports = cancellationService;
