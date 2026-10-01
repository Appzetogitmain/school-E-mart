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

/**
 * The authoritative balance: the sum of every row that moves money.
 *
 * Reading `balancePaise` off the newest row meant the figure a school could
 * withdraw against was the result of a read-modify-write — two commission
 * credits landing together both start from the same value and one overwrites
 * the other, permanently. Summing cannot drift.
 *
 * Rows flagged `affectsBalance: false` are records of what was taken rather than
 * movements in their own right, so they are excluded.
 */
const computeBalance = async (schoolId) => {
  const rows = await SchoolLedger.aggregate([
    { $match: { schoolId: toObjectId(schoolId), affectsBalance: { $ne: false } } },
    { $group: { _id: null, total: { $sum: '$amountPaise' } } },
  ]);
  return rows[0]?.total || 0;
};

const schoolFinanceService = {
  /**
   * Mirrors the vendor earnings summary: total kit commission earned, paid out,
   * the current ledger balance, and how much is still withdrawable after any
   * in-flight payout requests.
   */
  async getEarningsSummary(schoolId) {
    const [kitCredits, retailCredits, payouts, balance, pendingPayouts] = await Promise.all([
      sumByType(schoolId, 'kit_commission_credit'),
      sumByType(schoolId, 'retail_commission_credit'),
      sumByType(schoolId, 'payout_debit'),
      computeBalance(schoolId),
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

    const availableBalancePaise = balance;
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

    // Re-check now that this request exists. The balance check above reads then
    // writes, so two withdrawals submitted together both read the same figure,
    // both pass, and the platform is committed to paying out more than the
    // school has earned. Whichever request tips the total over withdraws itself.
    await this.assertPayoutsWithinBalance(schoolId, payout._id);

    return payout.toObject();
  },

  /**
   * Void a just-created payout if the in-flight total now exceeds the balance.
   * Only ever cancels the request it was given.
   */
  async assertPayoutsWithinBalance(schoolId, payoutId) {
    const summary = await this.getEarningsSummary(schoolId);
    const pending = await PayoutRequest.find({
      ownerType: 'school',
      schoolId: toObjectId(schoolId),
      status: { $in: ['pending', 'processing'] },
      'softDelete.isDeleted': { $ne: true },
    })
      .sort({ _id: 1 })
      .lean();

    // Creation order, so exactly the requests that overflow back out rather than
    // every racing request cancelling itself and leaving the school with none.
    let running = 0;
    for (const p of pending) {
      running += p.amountPaise || 0;
      if (String(p._id) !== String(payoutId)) continue;
      if (running <= summary.availableBalancePaise) return;

      await PayoutRequest.findOneAndUpdate(
        { _id: payoutId, status: 'pending' },
        {
          $set: {
            status: 'rejected',
            rejectionReason:
              'Another withdrawal was submitted at the same time and the balance no longer covers both.',
          },
        }
      );
      throw new BadRequestError(
        'Requested amount exceeds available withdrawable balance',
        null,
        'PAYOUT_EXCEEDS_BALANCE'
      );
    }
  },

  maskAccountNumber,
};

module.exports = schoolFinanceService;
