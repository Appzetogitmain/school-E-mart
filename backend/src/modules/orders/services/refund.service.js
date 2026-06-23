const { NotFoundError, BadRequestError } = require('../../../common/errors');
const paymentService = require('./payment.service');
const orderService = require('./order.service');
const paymentRepository = require('../repositories/payment.repository');

const refundService = {
  async requestRefund(orderId, { amountPaise, reason }, actor) {
    const order = await orderService.getOrder(orderId);
    if (!['paid', 'authorized', 'partially_refunded'].includes(order.paymentStatus)) {
      throw new BadRequestError('Order is not eligible for refund', null, 'REFUND_NOT_ELIGIBLE');
    }
    return paymentService.initiateRefund(
      orderId,
      { amountPaise: amountPaise || order.totalPaise, reason },
      { actorUserId: actor.userId }
    );
  },

  async getRefunds(orderId) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    return payment.refunds || [];
  },

  approveRefund(orderId, refundId, actor) {
    return paymentService.approveRefund(orderId, refundId, actor.userId);
  },

  rejectRefund(orderId, refundId, reason, actor) {
    return paymentService.rejectRefund(orderId, refundId, reason, actor.userId);
  },
};

module.exports = refundService;
