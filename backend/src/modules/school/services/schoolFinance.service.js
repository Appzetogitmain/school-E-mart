const mongoose = require('mongoose');
const SchoolLedger = require('../../../database/models/SchoolLedger');
const PayoutRequest = require('../../../database/models/PayoutRequest');
const School = require('../../../database/models/School');
const Order = require('../../../database/models/Order');
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

const COMMISSION_TYPES = new Set(['kit_commission_credit', 'retail_commission_credit']);

/**
 * Works out which order lines a ledger credit came from: lines of this school, of the same kind
 * (kit vs marketplace) that carried a school %, grouped per vendor (settlement credits one vendor
 * at a time). Returns the group whose commission adds up to the credited amount.
 */
const deriveFromOrder = (row, order, schoolId) => {
  const isKit = row.transactionType === 'kit_commission_credit';
  const lines = (order.items || []).filter(
    (it) =>
      String(it.schoolId) === String(schoolId) &&
      Boolean(it.kitId) === isKit &&
      Number(it.commission?.schoolPercent) > 0
  );
  const byVendor = new Map();
  for (const it of lines) {
    const key = String(it.vendorId);
    const g = byVendor.get(key) || { base: 0, commission: 0 };
    g.base += it.lineTotalPaise || 0;
    g.commission += Math.round(((it.lineTotalPaise || 0) * Number(it.commission.schoolPercent)) / 100);
    byVendor.set(key, g);
  }
  const groups = [...byVendor.values()];
  const all = groups.reduce((a, g) => ({ base: a.base + g.base, commission: a.commission + g.commission }), { base: 0, commission: 0 });
  const match = groups.find((g) => g.commission === row.amountPaise) || (all.commission === row.amountPaise ? all : null);
  if (!match || !match.base) return null;
  return {
    baseAmountPaise: match.base,
    commissionPercent: Math.round((row.amountPaise / match.base) * 10000) / 100,
  };
};

/**
 * Rows written before the ledger stored its working (order number, sale value, %) are filled in from
 * the order itself, so older credits show the same breakdown as new ones. If an order can no longer
 * be matched to the credited amount the row is returned as it was rather than showing a guess.
 */
const enrichCommissionRows = async (schoolId, rows) => {
  const needing = rows.filter(
    (r) => COMMISSION_TYPES.has(r.transactionType) && r.reference?.kind === 'Order' && !(r.baseAmountPaise > 0)
  );
  if (!needing.length) return rows;
  const orders = await Order.find({ _id: { $in: needing.map((r) => r.reference.id) } })
    .select('orderNumber items.schoolId items.kitId items.vendorId items.lineTotalPaise items.commission')
    .lean();
  const byId = new Map(orders.map((o) => [String(o._id), o]));
  return rows.map((r) => {
    if (!needing.includes(r)) return r;
    const order = byId.get(String(r.reference.id));
    if (!order) return r;
    return { ...r, orderNumber: r.orderNumber || order.orderNumber, ...(deriveFromOrder(r, order, schoolId) || {}) };
  });
};

const schoolFinanceService = {
  /**
   * Mirrors the vendor earnings summary: total kit commission earned, paid out,
   * the current ledger balance, and how much is still withdrawable after any
   * in-flight payout requests.
   */
  async getEarningsSummary(schoolId) {
    const [kitCredits, retailCredits, payouts, balance, pendingPayouts, schoolDoc] = await Promise.all([
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
      School.findById(schoolId).select('commission').lean(),
    ]);

    const availableBalancePaise = balance;
    const pendingSettlementPaise = pendingPayouts[0]?.total || 0;

    return {
      // The % the school currently earns (set by the platform). Orders already placed keep the % they
      // were placed with, which each transaction shows.
      commissionRates: {
        kitPercent: Number(schoolDoc?.commission?.kitPercent) || 0,
        retailPercent: Number(schoolDoc?.commission?.retailPercent) || 0,
      },
      kitEarningsPaise: kitCredits,
      retailEarningsPaise: retailCredits,
      totalEarningsPaise: kitCredits + retailCredits,
      totalPayoutsPaise: Math.abs(payouts),
      availableBalancePaise,
      pendingSettlementPaise,
      withdrawablePaise: Math.max(0, availableBalancePaise - pendingSettlementPaise),
    };
  },

  async listTransactions(schoolId, query = {}) {
    const filter = { schoolId };
    if (query.transactionType) filter.transactionType = query.transactionType;
    const result = await executePaginatedQuery(SchoolLedger, filter, query, { defaultSort: '-audit.createdAt' });
    result.data = await enrichCommissionRows(schoolId, result.data);
    return result;
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
