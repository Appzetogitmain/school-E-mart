const PayoutRequest = require('../../../database/models/PayoutRequest');
const VendorLedger = require('../../../database/models/VendorLedger');
const SchoolLedger = require('../../../database/models/SchoolLedger');
const PlatformLedger = require('../../../database/models/PlatformLedger');
const VendorProfile = require('../../../database/models/VendorProfile');
const School = require('../../../database/models/School');
const { executePaginatedQuery } = require('../../../repositories');
const { NotFoundError, BadRequestError } = require('../../../common/errors');

const buildStatusFilter = (query = {}) => {
  const filter = { 'softDelete.isDeleted': { $ne: true } };
  if (query.status) {
    filter.status = query.status;
  }
  return filter;
};

// Resolve the payee for each row — a vendor or a school — so the admin list can
// name who is withdrawing regardless of owner type.
const attachOwners = async (rows = []) => {
  const vendorIds = [...new Set(rows.map((row) => String(row.vendorId)).filter(Boolean))];
  const schoolIds = [...new Set(rows.map((row) => String(row.schoolId)).filter(Boolean))];

  const [vendors, schools] = await Promise.all([
    vendorIds.length
      ? VendorProfile.find({ _id: { $in: vendorIds } })
          .select('storeName storeSlug gstin approvalStatus')
          .lean()
      : [],
    schoolIds.length
      ? School.find({ _id: { $in: schoolIds } })
          .select('name code schoolRefNo')
          .lean()
      : [],
  ]);

  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));
  const schoolMap = new Map(schools.map((s) => [String(s._id), s]));

  return rows.map((row) => {
    const vendor = vendorMap.get(String(row.vendorId)) || null;
    const school = schoolMap.get(String(row.schoolId)) || null;
    return {
      ...row,
      vendor,
      school,
      // A single label the UI can render without caring about owner type.
      payeeName: school ? school.name : vendor ? vendor.storeName : null,
      payeeType: row.ownerType || (school ? 'school' : 'vendor'),
    };
  });
};

const adminWalletService = {
  async listPayoutRequests(query = {}) {
    const { data, pagination } = await executePaginatedQuery(
      PayoutRequest,
      buildStatusFilter(query),
      query,
      { defaultSort: '-audit.createdAt' }
    );
    return { data: await attachOwners(data), pagination };
  },

  async listVendorTransactions(query = {}) {
    const filter = {};
    if (query.vendorId) filter.vendorId = query.vendorId;
    if (query.transactionType) filter.transactionType = query.transactionType;

    const { data, pagination } = await executePaginatedQuery(VendorLedger, filter, query, {
      defaultSort: '-audit.createdAt',
    });
    return { data: await attachOwners(data), pagination };
  },

  async getOverview() {
    const [vendorLedgerTotals, schoolLedgerTotals, platformTotal, payoutTotals] = await Promise.all([
      VendorLedger.aggregate([{ $group: { _id: '$transactionType', total: { $sum: '$amountPaise' } } }]),
      SchoolLedger.aggregate([{ $group: { _id: '$transactionType', total: { $sum: '$amountPaise' } } }]),
      PlatformLedger.aggregate([
        { $match: { transactionType: 'commission_credit' } },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
      // Payout stats split by owner type so pending vendor vs school requests can
      // be surfaced separately.
      PayoutRequest.aggregate([
        { $match: { 'softDelete.isDeleted': { $ne: true } } },
        {
          $group: {
            _id: { status: '$status', ownerType: '$ownerType' },
            total: { $sum: '$amountPaise' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const vendorByType = Object.fromEntries(vendorLedgerTotals.map((r) => [r._id, r.total]));
    const schoolByType = Object.fromEntries(schoolLedgerTotals.map((r) => [r._id, r.total]));

    const sumPayouts = (predicate) =>
      payoutTotals.filter(predicate).reduce(
        (acc, r) => ({ total: acc.total + r.total, count: acc.count + r.count }),
        { total: 0, count: 0 }
      );

    const pending = sumPayouts((r) => r._id.status === 'pending');
    const processing = sumPayouts((r) => r._id.status === 'processing');
    const completed = sumPayouts((r) => r._id.status === 'completed');
    const pendingVendor = sumPayouts((r) => r._id.status === 'pending' && r._id.ownerType !== 'school');
    const pendingSchool = sumPayouts((r) => r._id.status === 'pending' && r._id.ownerType === 'school');

    const vendorEarningsPaise = vendorByType.order_credit || 0;
    const vendorCommissionPaise = Math.abs(vendorByType.commission_deduction || 0);
    const vendorPaidOutPaise = Math.abs(vendorByType.payout_debit || 0);

    const schoolEarningsPaise = schoolByType.kit_commission_credit || 0;
    const schoolPaidOutPaise = Math.abs(schoolByType.payout_debit || 0);

    // Platform revenue is the admin's own commission ledger. Older orders settled
    // before PlatformLedger existed only recorded the vendor-side deduction, so
    // fall back to that when the platform ledger is empty.
    const platformRevenuePaise = platformTotal[0]?.total || vendorCommissionPaise;

    return {
      // Vendor side
      totalEarningsPaise: vendorEarningsPaise,
      totalCommissionPaise: vendorCommissionPaise,
      totalPaidOutPaise: vendorPaidOutPaise + schoolPaidOutPaise,
      vendorOutstandingBalancePaise: vendorEarningsPaise - vendorCommissionPaise - vendorPaidOutPaise,
      // School side
      schoolEarningsPaise,
      schoolPaidOutPaise,
      schoolOutstandingBalancePaise: schoolEarningsPaise - schoolPaidOutPaise,
      // Platform
      platformRevenuePaise,
      // Payouts
      pendingPayoutPaise: pending.total,
      pendingPayoutCount: pending.count,
      pendingVendorPayoutPaise: pendingVendor.total,
      pendingSchoolPayoutPaise: pendingSchool.total,
      processingPayoutPaise: processing.total,
      completedPayoutPaise: completed.total,
      outstandingBalancePaise:
        vendorEarningsPaise - vendorCommissionPaise - vendorPaidOutPaise
        + schoolEarningsPaise - schoolPaidOutPaise,
    };
  },

  /**
   * Approve/complete a payout and post the debit to the payee's ledger (vendor or
   * school) so the running balance stays consistent with settlements.
   */
  async approvePayout(payoutId, actorUserId, { transactionReference } = {}) {
    const payout = await PayoutRequest.findById(payoutId);
    if (!payout || payout.softDelete?.isDeleted) {
      throw new NotFoundError('Payout request not found');
    }
    if (!['pending', 'processing'].includes(payout.status)) {
      throw new BadRequestError(`Cannot approve a ${payout.status} payout`);
    }

    const description = `Payout ${transactionReference || payout._id}`;
    if (payout.ownerType === 'school') {
      const latest = await SchoolLedger.findOne({ schoolId: payout.schoolId })
        .sort({ 'audit.createdAt': -1 })
        .lean();
      const newBalance = (latest?.balancePaise || 0) - payout.amountPaise;
      await SchoolLedger.create({
        schoolId: payout.schoolId,
        transactionType: 'payout_debit',
        amountPaise: -payout.amountPaise,
        balancePaise: newBalance,
        reference: { kind: 'PayoutRequest', id: payout._id },
        description,
      });
    } else {
      const latest = await VendorLedger.findOne({ vendorId: payout.vendorId })
        .sort({ 'audit.createdAt': -1 })
        .lean();
      const newBalance = (latest?.balancePaise || 0) - payout.amountPaise;
      await VendorLedger.create({
        vendorId: payout.vendorId,
        transactionType: 'payout_debit',
        amountPaise: -payout.amountPaise,
        balancePaise: newBalance,
        reference: { kind: 'PayoutRequest', id: payout._id },
        description,
      });
    }

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
