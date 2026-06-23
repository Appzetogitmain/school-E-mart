const { NotFoundError, BadRequestError } = require('../../../common/errors');
const returnRepository = require('../repositories/return.repository');
const ReturnRequest = require('../../../database/models/ReturnRequest');

const VENDOR_RETURN_TRANSITIONS = {
  requested: ['approved', 'rejected'],
  approved: ['qc_passed', 'rejected'],
  qc_passed: ['pickup_assigned'],
  pickup_assigned: ['in_transit'],
  in_transit: ['completed'],
};

const vendorReturnService = {
  listReturns(vendorId, query) {
    const filter = {};
    if (query.status) filter.status = query.status;
    if (query.search) {
      filter['productSnapshot.name'] = { $regex: query.search, $options: 'i' };
    }
    return returnRepository.paginateVendorReturns(vendorId, query, filter);
  },

  async getReturn(vendorId, returnId) {
    const returnRequest = await returnRepository.findVendorReturn(vendorId, returnId);
    if (!returnRequest) throw new NotFoundError('Return request not found', 'RETURN_NOT_FOUND');
    return returnRequest;
  },

  async updateReturnStatus(vendorId, returnId, { status, note, qcStatus }, actor = {}) {
    const returnRequest = await returnRepository.findVendorReturn(vendorId, returnId);
    if (!returnRequest) throw new NotFoundError('Return request not found', 'RETURN_NOT_FOUND');

    if (status === 'completed') {
      const ordersReturnService = require('../../orders/services/return.service');
      return ordersReturnService.completeReturn(returnId, actor);
    }

    const allowed = VENDOR_RETURN_TRANSITIONS[returnRequest.status] || [];
    if (!allowed.includes(status)) {
      throw new BadRequestError(
        `Cannot transition return from ${returnRequest.status} to ${status}`,
        null,
        'INVALID_RETURN_TRANSITION'
      );
    }

    const update = {
      $set: { status },
      $push: {
        timeline: {
          status,
          at: new Date(),
          note,
          byUserId: actor.userId,
        },
      },
    };
    if (qcStatus) update.$set.qcStatus = qcStatus;

    const updated = await ReturnRequest.findOneAndUpdate(
      { _id: returnId, vendorId },
      update,
      { new: true }
    ).lean();

    return updated;
  },

  approveReturn(vendorId, returnId, actor, note) {
    return this.updateReturnStatus(vendorId, returnId, { status: 'approved', note }, actor);
  },

  rejectReturn(vendorId, returnId, actor, reason) {
    return this.updateReturnStatus(
      vendorId,
      returnId,
      { status: 'rejected', note: reason, qcStatus: 'failed' },
      actor
    );
  },

  getReturnHistory(vendorId, query) {
    return this.listReturns(vendorId, query);
  },
};

module.exports = vendorReturnService;
