const VendorLedger = require('../../../database/models/VendorLedger');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class LedgerRepository extends BaseRepository {
  constructor() {
    super(VendorLedger, { useSoftDelete: false });
  }

  /**
   * Rows that do NOT move the balance.
   *
   * `commission_deduction` is named explicitly alongside the flag because rows
   * written before `affectsBalance` existed do not carry it, and treating those
   * as balance-affecting would subtract every historic commission a second time.
   */
  static get NON_BALANCE_FILTER() {
    return {
      $nor: [{ affectsBalance: false }, { transactionType: 'commission_deduction' }],
    };
  }

  /**
   * The authoritative balance: the sum of every row that moves money.
   *
   * Replaces reading `balancePaise` off the newest row. That value is written by
   * a read-modify-write of the previous row, so two settlements landing together
   * both read the same starting point and one silently overwrites the other —
   * and the error is permanent, because every later row builds on it. A sum
   * cannot drift and needs no locking.
   */
  async computeBalance(vendorId) {
    const [row] = await this.model.aggregate([
      { $match: { vendorId, ...LedgerRepository.NON_BALANCE_FILTER } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } },
    ]);
    return (row && row.total) || 0;
  }

  /**
   * Kept for history displays that want the value recorded at the time. Callers
   * deciding how much money a vendor may withdraw must use computeBalance.
   */
  findLatestBalance(vendorId) {
    return this.model
      .findOne({ vendorId })
      .sort({ 'audit.createdAt': -1 })
      .lean();
  }

  async paginateLedger(vendorId, queryString = {}, extraFilter = {}) {
    const filter = { vendorId, ...extraFilter };
    return executePaginatedQuery(this.model, filter, queryString, {
      defaultSort: '-audit.createdAt',
    });
  }

  sumByType(vendorId, transactionType) {
    return this.model.aggregate([
      { $match: { vendorId } },
      { $match: { transactionType } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } },
    ]);
  }
}

module.exports = new LedgerRepository();
