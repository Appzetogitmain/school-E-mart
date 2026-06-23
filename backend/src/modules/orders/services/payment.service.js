const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const paymentRepository = require('../repositories/payment.repository');
const paymentGateway = require('../../../services/paymentGateway');
const { randomHex } = require('../../../utils/crypto');
const Payment = require('../../../database/models/Payment');

const paymentService = {
  async createPaymentForOrder(order, { method, session = null }) {
    const idempotencyKey = `order-${order._id}-${randomHex(8)}`;
    const existing = await paymentRepository.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;

    const intent = await paymentGateway.createPaymentIntent({
      orderId: order._id,
      amountPaise: order.totalPaise,
      method: method === 'cod' ? 'cod' : 'upi',
    });

    const opts = session ? { session } : {};
    const [payment] = await Payment.create(
      [
        {
          orderId: order._id,
          userId: order.userId,
          amountPaise: order.totalPaise,
          currency: 'INR',
          method: method === 'cod' ? 'cod' : 'upi',
          gateway: intent.gateway,
          gatewayOrderId: intent.gatewayOrderId,
          status: method === 'cod' ? 'authorized' : 'initiated',
          idempotencyKey,
        },
      ],
      opts
    );

    return payment;
  },

  async confirmPayment(orderId, { session = null } = {}) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (payment.status === 'captured') return payment;

    const capture = await paymentGateway.capturePayment({ gatewayOrderId: payment.gatewayOrderId });
    const opts = session ? { session } : {};
    return Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: {
          status: 'captured',
          gatewayPaymentId: capture.gatewayPaymentId,
        },
      },
      { new: true, ...opts }
    ).lean();
  },

  async getPaymentByOrder(orderId) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    return payment;
  },

  async initiateRefund(orderId, { amountPaise, reason, actorUserId }, { session = null } = {}) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');
    if (!['captured', 'authorized', 'partially_refunded'].includes(payment.status)) {
      throw new BadRequestError('Payment is not refundable', null, 'PAYMENT_NOT_REFUNDABLE');
    }

    const refundAmount = amountPaise || payment.amountPaise;
    if (refundAmount > payment.amountPaise) {
      throw new BadRequestError('Refund amount exceeds payment', null, 'REFUND_AMOUNT_EXCEEDED');
    }

    const gatewayRefund = await paymentGateway.initiateRefund({
      gatewayPaymentId: payment.gatewayPaymentId || payment.gatewayOrderId,
      amountPaise: refundAmount,
      reason,
    });

    const refundEntry = {
      refundId: gatewayRefund.refundId,
      amountPaise: refundAmount,
      at: new Date(),
      reason,
      status: 'initiated',
      requestedBy: actorUserId,
    };

    const newStatus = refundAmount >= payment.amountPaise ? 'refunded' : 'partially_refunded';
    const opts = session ? { session } : {};
    return Payment.findByIdAndUpdate(
      payment._id,
      {
        $set: { status: newStatus },
        $push: { refunds: refundEntry },
      },
      { new: true, ...opts }
    ).lean();
  },

  async approveRefund(orderId, refundId, actorUserId) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');

    const refund = (payment.refunds || []).find((r) => r.refundId === refundId);
    if (!refund) throw new NotFoundError('Refund not found', 'REFUND_NOT_FOUND');
    if (refund.status === 'completed') {
      throw new ConflictError('Refund already completed', 'REFUND_ALREADY_COMPLETED');
    }

    return Payment.findOneAndUpdate(
      { _id: payment._id, 'refunds.refundId': refundId },
      {
        $set: {
          'refunds.$.status': 'completed',
          'refunds.$.approvedBy': actorUserId,
          'refunds.$.approvedAt': new Date(),
        },
      },
      { new: true }
    ).lean();
  },

  async rejectRefund(orderId, refundId, reason, actorUserId) {
    const payment = await paymentRepository.findByOrderId(orderId);
    if (!payment) throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND');

    return Payment.findOneAndUpdate(
      { _id: payment._id, 'refunds.refundId': refundId },
      {
        $set: {
          'refunds.$.status': 'rejected',
          'refunds.$.rejectionReason': reason,
          'refunds.$.rejectedBy': actorUserId,
          'refunds.$.rejectedAt': new Date(),
        },
      },
      { new: true }
    ).lean();
  },
};

module.exports = paymentService;
