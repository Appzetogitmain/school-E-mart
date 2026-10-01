const mongoose = require('mongoose');
const VendorLedger = require('../../src/database/models/VendorLedger');
const SchoolLedger = require('../../src/database/models/SchoolLedger');
const PayoutRequest = require('../../src/database/models/PayoutRequest');
const VendorProfile = require('../../src/database/models/VendorProfile');
const ledgerRepository = require('../../src/modules/vendor/repositories/ledger.repository');
const settlementService = require('../../src/modules/vendor/services/settlement.service');
const adminWalletService = require('../../src/modules/admin/services/wallet.service');

/**
 * Money-trail integrity for vendors and schools.
 *
 * The balance a payee can withdraw against used to be the `balancePaise` value
 * stored on their newest ledger row, written by reading the previous row and
 * adding to it. Two settlements landing together both read the same starting
 * figure and one silently overwrote the other — permanently, because every
 * later row built on the wrong number. These tests pin the properties that make
 * that impossible: the balance is a sum, and the rows that must not be summed
 * are marked as such.
 */
describe('ledger integrity', () => {
  let vendorId;
  let schoolId;

  const credit = (amountPaise, balancePaise, extra = {}) =>
    VendorLedger.create({
      vendorId,
      transactionType: 'order_credit',
      amountPaise,
      balancePaise,
      reference: { kind: 'Order', id: new mongoose.Types.ObjectId() },
      description: 'test credit',
      ...extra,
    });

  beforeEach(async () => {
    vendorId = new mongoose.Types.ObjectId();
    schoolId = new mongoose.Types.ObjectId();
  });

  test('balance is the sum of the rows, not the last stored figure', async () => {
    await credit(10000, 10000);
    await credit(5000, 15000);
    // A row whose stored running balance is wrong — exactly what a lost update
    // leaves behind. The computed balance must ignore it and stay correct.
    await credit(2500, 999999);

    expect(await ledgerRepository.computeBalance(vendorId)).toBe(17500);
  });

  test('a commission record is not subtracted from the balance a second time', async () => {
    // order_credit is written already net of commission, so the matching
    // commission row is a record of what was taken, not another deduction.
    await credit(9000, 9000);
    await VendorLedger.create({
      vendorId,
      transactionType: 'commission_deduction',
      amountPaise: -1000,
      affectsBalance: false,
      balancePaise: 9000,
      reference: { kind: 'Order', id: new mongoose.Types.ObjectId() },
      description: 'commission',
    });

    expect(await ledgerRepository.computeBalance(vendorId)).toBe(9000);
  });

  test('commission rows written before the flag existed are still excluded', async () => {
    await credit(9000, 9000);
    // No affectsBalance field at all, as every historic row in production is.
    await VendorLedger.collection.insertOne({
      vendorId,
      transactionType: 'commission_deduction',
      amountPaise: -1000,
      balancePaise: 9000,
      reference: { kind: 'Order', id: new mongoose.Types.ObjectId() },
      description: 'legacy commission',
    });

    expect(await ledgerRepository.computeBalance(vendorId)).toBe(9000);
  });

  test('payout debits do reduce the balance', async () => {
    await credit(10000, 10000);
    await VendorLedger.create({
      vendorId,
      transactionType: 'payout_debit',
      amountPaise: -4000,
      balancePaise: 6000,
      reference: { kind: 'PayoutRequest', id: new mongoose.Types.ObjectId() },
      description: 'payout',
    });

    expect(await ledgerRepository.computeBalance(vendorId)).toBe(6000);
  });

  describe('withdrawals cannot over-commit the balance', () => {
    beforeEach(async () => {
      const vendor = await VendorProfile.create({
        userId: new mongoose.Types.ObjectId(),
        storeName: 'Race Test Store',
        storeSlug: `race-${Date.now()}`,
        commissionPercent: 10,
        serviceRadiusKm: 10,
        address: {
          line1: '1 Test Street',
          city: 'Indore',
          state: 'Madhya Pradesh',
          pinCode: '452001',
          country: 'India',
        },
        bank: {
          accountName: 'Race Test',
          bankName: 'Test Bank',
          ifsc: 'TEST0001234',
          accountNumber: '123456789',
          accountNumberEnc: 'enc',
          accountNumberMasked: '****6789',
        },
      });
      vendorId = vendor._id;
      await credit(10000, 10000); // Rs.100 available
    });

    test('a single withdrawal within the balance succeeds', async () => {
      const payout = await settlementService.createPayoutRequest(vendorId, 6000);
      expect(payout.status).toBe('pending');
    });

    test('two simultaneous withdrawals cannot both take the same money', async () => {
      // Each is individually affordable; together they exceed the balance.
      const results = await Promise.allSettled([
        settlementService.createPayoutRequest(vendorId, 6000),
        settlementService.createPayoutRequest(vendorId, 6000),
      ]);

      const accepted = await PayoutRequest.find({
        vendorId,
        status: { $in: ['pending', 'processing'] },
      }).lean();
      const committed = accepted.reduce((s, p) => s + p.amountPaise, 0);

      // Whatever the interleaving, the platform is never committed to paying
      // out more than the vendor actually has.
      expect(committed).toBeLessThanOrEqual(10000);
      expect(results.some((r) => r.status === 'fulfilled')).toBe(true);
    });
  });

  describe('payout approval', () => {
    let payoutId;

    beforeEach(async () => {
      await credit(10000, 10000);
      const payout = await PayoutRequest.create({
        vendorId,
        ownerType: 'vendor',
        payeeName: 'Race Test Store',
        payeeType: 'vendor',
        amountPaise: 5000,
        bankDetailsSnapshot: { accountName: 'x', ifsc: 'TEST0001234', accountNumber: '1' },
        status: 'pending',
      });
      payoutId = payout._id;
    });

    test('posts exactly one debit and completes the request', async () => {
      await adminWalletService.approvePayout(payoutId, new mongoose.Types.ObjectId());

      const debits = await VendorLedger.find({
        vendorId,
        transactionType: 'payout_debit',
      }).lean();
      expect(debits).toHaveLength(1);
      expect(debits[0].amountPaise).toBe(-5000);
      expect(await ledgerRepository.computeBalance(vendorId)).toBe(5000);
    });

    test('approving twice never debits the payee twice', async () => {
      const actor = new mongoose.Types.ObjectId();
      // The status check and the save used to be separate steps, so two
      // approvals arriving together both posted a debit for one withdrawal.
      await Promise.allSettled([
        adminWalletService.approvePayout(payoutId, actor),
        adminWalletService.approvePayout(payoutId, actor),
      ]);

      const debits = await VendorLedger.find({
        vendorId,
        transactionType: 'payout_debit',
      }).lean();
      expect(debits).toHaveLength(1);
      expect(await ledgerRepository.computeBalance(vendorId)).toBe(5000);
    });

    test('a second approval attempt is refused outright', async () => {
      await adminWalletService.approvePayout(payoutId, new mongoose.Types.ObjectId());
      await expect(
        adminWalletService.approvePayout(payoutId, new mongoose.Types.ObjectId())
      ).rejects.toThrow();
    });
  });

  test('school balances ignore rows flagged as non-affecting', async () => {
    await SchoolLedger.create({
      schoolId,
      transactionType: 'kit_commission_credit',
      amountPaise: 8000,
      balancePaise: 8000,
      reference: { kind: 'Order', id: new mongoose.Types.ObjectId() },
      description: 'kit commission',
    });
    await SchoolLedger.create({
      schoolId,
      transactionType: 'adjustment',
      amountPaise: -500,
      affectsBalance: false,
      balancePaise: 8000,
      reference: { kind: 'Order', id: new mongoose.Types.ObjectId() },
      description: 'informational only',
    });

    const [row] = await SchoolLedger.aggregate([
      { $match: { schoolId, affectsBalance: { $ne: false } } },
      { $group: { _id: null, total: { $sum: '$amountPaise' } } },
    ]);
    expect(row.total).toBe(8000);
  });
});
