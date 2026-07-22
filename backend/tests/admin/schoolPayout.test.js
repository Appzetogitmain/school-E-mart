const mongoose = require('mongoose');
const schoolFinanceService = require('../../src/modules/school/services/schoolFinance.service');
const adminWalletService = require('../../src/modules/admin/services/wallet.service');
const School = require('../../src/database/models/School');
const SchoolLedger = require('../../src/database/models/SchoolLedger');
const { encryptAccountNumber } = require('../../src/modules/vendor/utils/bank');

// School side of the withdrawal system: a school earns kit commission, requests a
// payout, and the admin approval posts the debit to the school ledger.
describe('school withdrawal flow', () => {
  let schoolId;

  beforeEach(async () => {
    const school = await School.create({
      code: `SCH-${Date.now()}`,
      name: 'Test School',
      schoolRefNo: `REF-${Date.now()}`,
      partnerStatus: 'active',
      bank: {
        accountName: 'Test School',
        bankName: 'HDFC',
        accountNumberEnc: encryptAccountNumber('12345678'),
        ifsc: 'HDFC0000001',
      },
    });
    schoolId = school._id;

    // Seed ₹200 of kit-commission earnings.
    await SchoolLedger.create({
      schoolId,
      transactionType: 'kit_commission_credit',
      amountPaise: 20000,
      balancePaise: 20000,
      reference: { kind: 'Order', id: new mongoose.Types.ObjectId() },
      description: 'seed earnings',
    });
  });

  test('summary reflects earnings and withdrawable balance', async () => {
    const summary = await schoolFinanceService.getEarningsSummary(schoolId);
    expect(summary.totalEarningsPaise).toBe(20000);
    expect(summary.availableBalancePaise).toBe(20000);
    expect(summary.withdrawablePaise).toBe(20000);
  });

  test('rejects a withdrawal larger than the balance', async () => {
    await expect(schoolFinanceService.createPayoutRequest(schoolId, 30000)).rejects.toThrow(/exceeds/i);
  });

  test('requires bank details before withdrawing', async () => {
    await School.findByIdAndUpdate(schoolId, { $unset: { bank: 1 } });
    await expect(schoolFinanceService.createPayoutRequest(schoolId, 5000)).rejects.toThrow(/bank details/i);
  });

  test('an in-flight request lowers the withdrawable amount', async () => {
    await schoolFinanceService.createPayoutRequest(schoolId, 15000);
    const summary = await schoolFinanceService.getEarningsSummary(schoolId);
    expect(summary.withdrawablePaise).toBe(5000);
  });

  test('admin approval debits the school ledger and settles the payout', async () => {
    const payout = await schoolFinanceService.createPayoutRequest(schoolId, 15000);
    expect(payout.ownerType).toBe('school');
    expect(payout.status).toBe('pending');

    const approved = await adminWalletService.approvePayout(payout._id, new mongoose.Types.ObjectId(), {
      transactionReference: 'UTR123',
    });
    expect(approved.status).toBe('completed');

    const debit = await SchoolLedger.findOne({ schoolId, transactionType: 'payout_debit' }).lean();
    expect(debit).not.toBeNull();
    expect(debit.amountPaise).toBe(-15000);
    expect(debit.balancePaise).toBe(5000);

    const summary = await schoolFinanceService.getEarningsSummary(schoolId);
    expect(summary.totalPayoutsPaise).toBe(15000);
    expect(summary.availableBalancePaise).toBe(5000);
  });
});
