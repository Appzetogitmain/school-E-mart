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
    const [kitCredits, retailCredits, payouts, latest, pendingPayouts] = await Promise.all([
      sumByType(schoolId, 'kit_commission_credit'),
      sumByType(schoolId, 'retail_commission_credit'),
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
      kitEarningsPaise: kitCredits,
      retailEarningsPaise: retailCredits,
      totalEarningsPaise: kitCredits + retailCredits,
      totalPayoutsPaise: Math.abs(payouts),
      availableBalancePaise,
      pendingSettlementPaise,
      withdrawablePaise: Math.max(0, availableBalancePaise - pendingSettlementPaise),
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
    const accNum = bank.accountNumber || bank.accountNumberMasked || '';
    return {
      accountName: bank.accountName || '',
      bankName: bank.bankName || '',
      branch: bank.branch || '',
      ifsc: bank.ifsc || '',
      accountNumber: accNum,
      accountNumberMasked: accNum,
      accountNumberSet: Boolean(accNum || bank.accountNumberEnc),
    };
  },

  async updateBankDetails(schoolId, payload) {
    const set = {};
    if (payload.accountName !== undefined && payload.accountName !== null) set['bank.accountName'] = payload.accountName;
    if (payload.bankName !== undefined && payload.bankName !== null) set['bank.bankName'] = payload.bankName;
    if (payload.branch !== undefined && payload.branch !== null) set['bank.branch'] = payload.branch;
    if (payload.ifsc !== undefined && payload.ifsc !== null) set['bank.ifsc'] = payload.ifsc;
    if (payload.accountNumber) {
      const cleanAcc = String(payload.accountNumber).replace(/\s+/g, '');
      set['bank.accountNumber'] = cleanAcc;
      set['bank.accountNumberEnc'] = encryptAccountNumber(cleanAcc);
      set['bank.accountNumberMasked'] = cleanAcc;
    }

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
    if (amount < 100) {
      throw new BadRequestError('Minimum payout amount is ₹1');
    }

    const summary = await this.getEarningsSummary(schoolId);
    if (amount > summary.withdrawablePaise) {
      throw new BadRequestError('Requested amount exceeds available withdrawable balance');
    }

    const school = await School.findById(schoolId).lean();
    if (!school) {
      throw new NotFoundError('School not found');
    }
    const bank = school.bank || {};
    if ((!bank.accountNumber && !bank.accountNumberEnc) || !bank.ifsc) {
      throw new BadRequestError('Configure your bank details before requesting a withdrawal');
    }

    const accNum = bank.accountNumber || bank.accountNumberMasked || '';

    const payout = await PayoutRequest.create({
      schoolId,
      ownerType: 'school',
      payeeName: school.name,
      payeeType: 'school',
      amountPaise: amount,
      bankDetailsSnapshot: {
        accountName: bank.accountName,
        bankName: bank.bankName,
        branch: bank.branch,
        accountNumber: accNum,
        accountNumberEnc: bank.accountNumberEnc,
        accountNumberMasked: accNum,
        ifsc: bank.ifsc,
      },
    });

    return payout.toObject();
  },

  maskAccountNumber,
};

module.exports = schoolFinanceService;
