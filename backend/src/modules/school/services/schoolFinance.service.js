const mongoose = require('mongoose');
const SchoolLedger = require('../../../database/models/SchoolLedger');
const PayoutRequest = require('../../../database/models/PayoutRequest');
const School = require('../../../database/models/School');
const { executePaginatedQuery } = require('../../../repositories');
const { BadRequestError, NotFoundError } = require('../../../common/errors');
const { encryptAccountNumber, maskAccountNumber } = require('../../vendor/utils/bank');

const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));

// Aggregates need an explicit ObjectId cast — $match does not coerce strings.
const sumByType = async (schoolId, transactionType) => {
  const rows = await SchoolLedger.aggregate([
    { $match: { schoolId: toObjectId(schoolId), transactionType } },
    { $group: { _id: null, total: { $sum: '$amountPaise' } } },
  ]);
  return rows[0]?.total || 0;
};

const findLatestBalance = (schoolId) =>
  SchoolLedger.findOne({ schoolId }).sort({ 'audit.createdAt': -1 }).lean();

const schoolFinanceService = {
  /**
   * Mirrors the vendor earnings summary: total kit commission earned, paid out,
   * the current ledger balance, and how much is still withdrawable after any
   * in-flight payout requests.
   */
  async getEarningsSummary(schoolId) {
    const [credits, payouts, latest, pendingPayouts] = await Promise.all([
      sumByType(schoolId, 'kit_commission_credit'),
      sumByType(schoolId, 'payout_debit'),
      findLatestBalance(schoolId),
      PayoutRequest.aggregate([
        {
          $match: {
            ownerType: 'school',
            schoolId: toObjectId(schoolId),
            status: { $in: ['pending', 'processing'] },
            'softDelete.isDeleted': { $ne: true },
          },
        },
        { $group: { _id: null, total: { $sum: '$amountPaise' } } },
      ]),
    ]);

    const availableBalancePaise = latest?.balancePaise || 0;
    const pendingSettlementPaise = pendingPayouts[0]?.total || 0;

    return {
      totalEarningsPaise: credits,
      totalPayoutsPaise: Math.abs(payouts),
      availableBalancePaise,
      pendingSettlementPaise,
      withdrawablePaise: availableBalancePaise - pendingSettlementPaise,
    };
  },

  listTransactions(schoolId, query = {}) {
    const filter = { schoolId };
    if (query.transactionType) filter.transactionType = query.transactionType;
    return executePaginatedQuery(SchoolLedger, filter, query, { defaultSort: '-audit.createdAt' });
  },

  listPayoutRequests(schoolId, query = {}) {
    const filter = { ownerType: 'school', schoolId, 'softDelete.isDeleted': { $ne: true } };
    if (query.status) filter.status = query.status;
    return executePaginatedQuery(PayoutRequest, filter, query, { defaultSort: '-audit.createdAt' });
  },

  async getBankDetails(schoolId) {
    const school = await School.findById(schoolId).select('bank').lean();
    if (!school) throw new NotFoundError('School not found');
    const bank = school.bank || {};
    return {
      accountName: bank.accountName || '',
      bankName: bank.bankName || '',
      branch: bank.branch || '',
      ifsc: bank.ifsc || '',
      // The number itself is one-way hashed; surface only whether one is set.
      accountNumberSet: Boolean(bank.accountNumberEnc),
    };
  },

  async updateBankDetails(schoolId, payload) {
    const set = {};
    if (payload.accountName !== undefined) set['bank.accountName'] = payload.accountName;
    if (payload.bankName !== undefined) set['bank.bankName'] = payload.bankName;
    if (payload.branch !== undefined) set['bank.branch'] = payload.branch;
    if (payload.ifsc !== undefined) set['bank.ifsc'] = payload.ifsc;
    if (payload.accountNumber) set['bank.accountNumberEnc'] = encryptAccountNumber(payload.accountNumber);

    const school = await School.findByIdAndUpdate(schoolId, { $set: set }, { new: true })
      .select('bank')
      .lean();
    if (!school) throw new NotFoundError('School not found');
    return this.getBankDetails(schoolId);
  },

  /**
   * School-initiated withdrawal. Validated against the balance still available
   * after any in-flight payouts, and refuses until bank details exist.
   */
  async createPayoutRequest(schoolId, amountPaise) {
    const amount = Math.round(Number(amountPaise) || 0);
    if (amount < 100) throw new BadRequestError('Minimum payout amount is ₹1');

    const summary = await this.getEarningsSummary(schoolId);
    if (amount > summary.withdrawablePaise) {
      throw new BadRequestError('Requested amount exceeds available balance');
    }

    const school = await School.findById(schoolId).lean();
    if (!school) throw new NotFoundError('School not found');
    const bank = school.bank || {};
    if (!bank.accountNumberEnc || !bank.ifsc) {
      throw new BadRequestError('Add your bank details before requesting a payout');
    }

    const payout = await PayoutRequest.create({
      ownerType: 'school',
      schoolId,
      amountPaise: amount,
      bankDetailsSnapshot: {
        accountName: bank.accountName,
        bankName: bank.bankName,
        accountNumberEnc: bank.accountNumberEnc,
        ifsc: bank.ifsc,
      },
      status: 'pending',
    });
    return payout.toObject();
  },

  maskAccountNumber,
};

module.exports = schoolFinanceService;
