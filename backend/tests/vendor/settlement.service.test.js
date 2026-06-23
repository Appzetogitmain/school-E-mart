const settlementService = require('../../src/modules/vendor/services/settlement.service');
const { createVendorUser, seedProduct, seedOrder } = require('./helpers');
const User = require('../../src/database/models/User');
const Order = require('../../src/database/models/Order');

describe('vendor settlement service', () => {
  let vendorId;
  let orderId;

  beforeEach(async () => {
    const { profile } = await createVendorUser({ approvalStatus: 'approved' });
    vendorId = profile._id;
    const customer = await User.create({
      refId: 'SEM-P-SETTLE1',
      role: 'parent',
      status: 'active',
      name: 'Customer',
      phone: '9123456780',
    });
    const product = await seedProduct(vendorId);
    const order = await seedOrder(vendorId, customer._id, product);
    await Order.findByIdAndUpdate(order._id, { orderStatus: 'delivered', deliveredAt: new Date() });
    orderId = order._id;
  });

  test('calculates commission correctly', () => {
    const result = settlementService.calculateCommission(100000, 10);
    expect(result.commissionPaise).toBe(10000);
    expect(result.vendorEarningPaise).toBe(90000);
  });

  test('records order settlement in ledger', async () => {
    const entry = await settlementService.recordOrderSettlement(vendorId, orderId);
    expect(entry.transactionType).toBe('order_credit');
    expect(entry.amountPaise).toBe(18000);

    const duplicate = await settlementService.recordOrderSettlement(vendorId, orderId);
    expect(String(duplicate._id)).toBe(String(entry._id));
  });

  test('returns earnings summary', async () => {
    await settlementService.recordOrderSettlement(vendorId, orderId);
    const summary = await settlementService.getEarningsSummary(vendorId);
    expect(summary.totalEarningsPaise).toBe(18000);
    expect(summary.totalCommissionPaise).toBe(2000);
    expect(summary.availableBalancePaise).toBe(18000);
  });
});
