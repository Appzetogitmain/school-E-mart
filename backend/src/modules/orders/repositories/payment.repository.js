const mongoose = require('mongoose');
const Payment = require('../../../database/models/Payment');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment, { useSoftDelete: false });
  }

  findByOrderId(orderId, queryOptions = {}) {
    return this.findOne({ orderId }, queryOptions);
  }

  findByIdempotencyKey(key) {
    return this.findOne({ idempotencyKey: key });
  }

  /**
   * The payment for an order that actually holds money.
   *
   * Refunds must target this one, not whichever row findOne happens to return.
   * An order can carry several Payment rows — an abandoned online attempt
   * alongside the one that succeeded, or an RFQ advance alongside its
   * remainder — and refunding against an uncaptured row fails at the gateway.
   * Prefers the largest captured payment, then a partially refunded one.
   */
  async findCapturedForOrder(orderId) {
    // Money actually taken outranks money merely held, so the two are queried in
    // that order rather than sorted together — sorting on the status string
    // would put 'authorized' ahead of 'captured' alphabetically and refund
    // against a payment the gateway has not collected.
    const settled = await this.model
      .findOne({ orderId, status: { $in: ['captured', 'partially_refunded'] } })
      .sort({ amountPaise: -1 })
      .lean();
    if (settled) return settled;

    return this.model.findOne({ orderId, status: 'authorized' }).sort({ amountPaise: -1 }).lean();
  }

  /** The payment on an order that carries a given refund id. */
  findByRefundId(orderId, refundId) {
    return this.model.findOne({ orderId, 'refunds.refundId': refundId }).lean();
  }

  /** Every payment attached to an order, oldest first. */
  findAllForOrder(orderId) {
    return this.model.find({ orderId }).sort({ 'audit.createdAt': 1 }).lean();
  }

  /**
   * Total money actually captured against one order, in paise.
   *
   * The authority on whether an order is paid. Deciding that from the request body —
   * or from the mere existence of a Payment row — is what let an unpaid online order
   * be treated as paid; only a captured payment counts, and an RFQ order's advance and
   * remainder both count towards the same total.
   */
  async sumCapturedForOrder(orderId) {
    const [row] = await Payment.aggregate([
      { $match: { orderId: new mongoose.Types.ObjectId(String(orderId)), status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } },
    ]);
    return row?.total || 0;
  }

  async paginateByOrder(orderId, queryString = {}) {
    return executePaginatedQuery(this.model, { orderId }, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }
}

module.exports = new PaymentRepository();
