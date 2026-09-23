const { NotFoundError, BadRequestError } = require('../../../common/errors');
const paymentService = require('./payment.service');
const orderService = require('./order.service');
const paymentRepository = require('../repositories/payment.repository');

const refundService = {
  async requestRefund(orderId, { amountPaise, reason }, actor) {
    const order = await orderService.getOrder(orderId);
    if (!['paid', 'authorized', 'partially_paid', 'partially_refunded'].includes(order.paymentStatus)) {
      throw new BadRequestError('Order is not eligible for refund', null, 'REFUND_NOT_ELIGIBLE');
    }
    // actorUserId belongs in the payload, not a trailing options object — it
    // used to be passed as options and so never reached the refund record at all.
    return paymentService.initiateRefund(orderId, {
      amountPaise,
      reason,
      actorUserId: actor.userId,
    });
  },

  /**
   * Every refund on the order, across all of its payments.
   *
   * Reading only the first payment row missed refunds on an order that has more
   * than one — an RFQ advance and its remainder, or a retried checkout.
   */
  async getRefunds(orderId) {
    const payments = await paymentRepository.findAllForOrder(orderId);
    if (!payments.length) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    return payments.flatMap((payment) =>
      (payment.refunds || []).map((refund) => ({
        ...refund,
        paymentId: payment._id,
        gatewayPaymentId: payment.gatewayPaymentId,
      }))
    );
  },

  approveRefund(orderId, refundId, actor) {
    return paymentService.approveRefund(orderId, refundId, actor.userId);
  },

  rejectRefund(orderId, refundId, reason, actor) {
    return paymentService.rejectRefund(orderId, refundId, reason, actor.userId);
  },
};

module.exports = refundService;
