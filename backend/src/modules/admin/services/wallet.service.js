const PayoutRequest = require('../../../database/models/PayoutRequest');
const VendorLedger = require('../../../database/models/VendorLedger');
const VendorProfile = require('../../../database/models/VendorProfile');
const { executePaginatedQuery } = require('../../../repositories');
const { NotFoundError, BadRequestError } = require('../../../common/errors');

const buildStatusFilter = (query = {}) => {
  const filter = { 'softDelete.isDeleted': { $ne: true } };
  if (query.status) {
    filter.status = query.status;
  }
  return filter;
};

const attachVendors = async (rows = []) => {
  const vendorIds = [...new Set(rows.map((row) => String(row.vendorId)).filter(Boolean))];
  if (!vendorIds.length) return rows;

  const vendors = await VendorProfile.find({ _id: { $in: vendorIds } })
    .select('storeName storeSlug gstin approvalStatus')
    .lean();
  const map = new Map(vendors.map((v) => [String(v._id), v]));

  return rows.map((row) => ({
    ...row,
    vendor: map.get(String(row.vendorId)) || null,
  }));
};

const adminWalletService = {
  async listPayoutRequests(query = {}) {
    const { data, pagination } = await executePaginatedQuery(
      PayoutRequest,
      buildStatusFilter(query),
      query,
      { defaultSort: '-audit.createdAt' }
    );
    return { data: await attachVendors(data), pagination };
  },

  async listVendorTransactions(query = {}) {
    const filter = {};
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.transactionType) filter.transactionType = query.transactionType;

    const { data, pagination } = await executePaginatedQuery(VendorLedger, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    return { data: await attachVendors(data), pagination };
  },

  async getOverview() {
    const [ledgerTotals, payoutTotals] = await Promise.all([
      VendorLedger.aggregate([
        { $group: { _id: '$transactionType', total: { $sum: '$amountPaise' } } },
      ]),
      PayoutRequest.aggregate([
        { $match: { 'softDelete.isDeleted': { $ne: true } } },
        { $group: { _id: '$status', total: { $sum: '$amountPaise' }, count: { $sum: 1 } } },
      ]),
    ]);

    const byType = Object.fromEntries(ledgerTotals.map((r) => [r._id, r.total]));
    const byStatus = Object.fromEntries(payoutTotals.map((r) => [r._id, r]));

    const totalEarningsPaise = byType.order_credit || 0;
    const totalCommissionPaise = Math.abs(byType.commission_deduction || 0);
    const totalPaidOutPaise = Math.abs(byType.payout_debit || 0);

    return {
      totalEarningsPaise,
      totalCommissionPaise,
      totalPaidOutPaise,
      platformRevenuePaise: totalCommissionPaise,
      pendingPayoutPaise: byStatus.pending?.total || 0,
      pendingPayoutCount: byStatus.pending?.count || 0,
      processingPayoutPaise: byStatus.processing?.total || 0,
      completedPayoutPaise: byStatus.completed?.total || 0,
      outstandingBalancePaise: totalEarningsPaise - totalCommissionPaise - totalPaidOutPaise,
    };
  },

  /**
   * Approve/complete a payout and post the debit to the vendor ledger so the
   * running balance stays consistent with settlements.
   */
  async approvePayout(payoutId, actorUserId, { transactionReference } = {}) {
    const payout = await PayoutRequest.findById(payoutId);
    if (!payout || payout.softDelete?.isDeleted) {
      throw new NotFoundError('Payout request not found');
    }
    if (!['pending', 'processing'].includes(payout.status)) {
      throw new BadRequestError(`Cannot approve a ${payout.status} payout`);
    }

    const latest = await VendorLedger.findOne({ vendorId: payout.vendorId })
      .sort({ 'audit.createdAt': -1 })
      .lean();
    const currentBalance = latest?.balancePaise || 0;
    const newBalance = currentBalance - payout.amountPaise;

    await VendorLedger.create({
      vendorId: payout.vendorId,
      transactionType: 'payout_debit',
      amountPaise: -payout.amountPaise,
      balancePaise: newBalance,
      reference: { kind: 'PayoutRequest', id: payout._id },
      description: `Payout ${transactionReference || payout._id}`,
    });

    payout.status = 'completed';
    payout.processedBy = actorUserId;
    payout.processedAt = new Date();
    if (transactionReference) payout.transactionReference = transactionReference;
    await payout.save();

    return payout.toObject();
  },

  /** Manual admin credit/debit adjustment posted to the vendor ledger. */
  async createAdjustment({ vendorId, amountPaise, direction, remarks }, actorUserId) {
    const vendor = await VendorProfile.findById(vendorId).lean();
    if (!vendor) {
      throw new NotFoundError('Vendor not found');
    }

    const magnitude = Math.abs(Math.round(Number(amountPaise) || 0));
    if (magnitude < 1) {
      throw new BadRequestError('Enter a valid amount');
    }
    const signed = direction === 'debit' ? -magnitude : magnitude;

    const latest = await VendorLedger.findOne({ vendorId })
      .sort({ 'audit.createdAt': -1 })
      .lean();
    const newBalance = (latest?.balancePaise || 0) + signed;

    const entry = await VendorLedger.create({
      vendorId,
      transactionType: 'adjustment',
      amountPaise: signed,
      balancePaise: newBalance,
      reference: { kind: 'AdminAdjustment', id: actorUserId },
      description: remarks || 'Manual administrative adjustment',
    });

    return entry.toObject();
  },

  async rejectPayout(payoutId, actorUserId, { reason } = {}) {
    const payout = await PayoutRequest.findById(payoutId);
    if (!payout || payout.softDelete?.isDeleted) {
      throw new NotFoundError('Payout request not found');
    }
    if (!['pending', 'processing'].includes(payout.status)) {
      throw new BadRequestError(`Cannot reject a ${payout.status} payout`);
    }

    payout.status = 'rejected';
    payout.processedBy = actorUserId;
    payout.processedAt = new Date();
    payout.rejectionReason = reason || 'Rejected by admin';
    await payout.save();

    return payout.toObject();
  },
};

module.exports = adminWalletService;
