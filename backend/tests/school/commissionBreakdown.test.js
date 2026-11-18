const mongoose = require('mongoose');
const settlementService = require('../../src/modules/vendor/services/settlement.service');
const schoolFinanceService = require('../../src/modules/school/services/schoolFinance.service');
const { createVendorUser } = require('../vendor/helpers');
const User = require('../../src/database/models/User');
const Order = require('../../src/database/models/Order');
const School = require('../../src/database/models/School');
const SchoolLedger = require('../../src/database/models/SchoolLedger');

// A school must be able to check its own commission: the rate it earns, and for every credit the order,
// the sale value the % was applied to, the % and the amount.
describe('school wallet: commission rates and per-transaction breakdown', () => {
  let schoolId;
  let customerId;
  let vendorA;
  let vendorB;
  let seq = 0;

  const line = (vendorId, extra) => ({
    productId: new mongoose.Types.ObjectId(),
    vendorId,
    name: 'Item',
    sku: `SKU-${(seq += 1)}`,
    mrpPaise: 100000,
    quantity: 1,
    taxPaise: 0,
    ...extra,
  });

  const makeOrder = async (items, extra = {}) => {
    const total = items.reduce((s, i) => s + i.lineTotalPaise, 0);
    seq += 1;
    return Order.create({
      orderNumber: `ORD${Date.now()}${seq}`,
      userId: customerId,
      audience: 'parent',
      items,
      vendorIds: [...new Set(items.map((i) => String(i.vendorId)))],
      subtotalPaise: total,
      taxPaise: 0,
      discountPaise: 0,
      platformFeePaise: 0,
      deliveryChargePaise: 0,
      handlingChargePaise: 0,
      totalPaise: total,
      address: { line1: 'Test' },
      deliveryType: 'home',
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      deliveredAt: new Date(),
      statusHistory: [{ status: 'delivered', at: new Date() }],
      placedAt: new Date(),
      ...extra,
    });
  };

  const kitLine = (vendorId, rupees, schoolPercent = 15) =>
    line(vendorId, {
      schoolId,
      kitId: new mongoose.Types.ObjectId(),
      commission: { adminPercent: 10, schoolPercent },
      pricePaise: rupees * 100,
      lineTotalPaise: rupees * 100,
    });
  const retailLine = (vendorId, rupees, schoolPercent = 2) =>
    line(vendorId, {
      schoolId,
      commission: { adminPercent: 10, schoolPercent },
      pricePaise: rupees * 100,
      lineTotalPaise: rupees * 100,
    });

  const settle = async (order) => {
    for (const vId of order.vendorIds) await settlementService.recordOrderSettlement(vId, order._id);
  };

  const txns = async () => (await schoolFinanceService.listTransactions(schoolId, {})).data;

  beforeEach(async () => {
    ({ profile: { _id: vendorA } } = await createVendorUser({ approvalStatus: 'approved' }));
    ({ profile: { _id: vendorB } } = await createVendorUser({ approvalStatus: 'approved', storeName: 'Store B' }));
    const school = await School.create({
      code: `SCH-${Date.now()}`,
      name: 'Rates School',
      schoolRefNo: `REF-${Date.now()}`,
      partnerStatus: 'active',
      commission: { kitPercent: 12.5, retailPercent: 2 },
    });
    schoolId = school._id;
    customerId = (
      await User.create({ refId: "SEM-P-BUYER1", role: 'parent', status: 'active', name: 'Buyer', phone: '9123456701' })
    )._id;
  });

  test('the summary carries the school\'s current kit and marketplace rates', async () => {
    const summary = await schoolFinanceService.getEarningsSummary(schoolId);
    expect(summary.commissionRates).toEqual({ kitPercent: 12.5, retailPercent: 2 });
  });

  test('rates default to 0 for a school that has none set', async () => {
    const bare = await School.create({ code: `SCH-B-${Date.now()}`, name: 'Bare', schoolRefNo: `REF-B-${Date.now()}`, partnerStatus: 'active' });
    const summary = await schoolFinanceService.getEarningsSummary(bare._id);
    expect(summary.commissionRates).toEqual({ kitPercent: 0, retailPercent: 0 });
  });

  test('a kit credit stores order number, sale value, % and amount', async () => {
    const order = await makeOrder([kitLine(vendorA, 1000, 15)]);
    await settle(order);
    const [row] = await txns();
    expect(row.transactionType).toBe('kit_commission_credit');
    expect(row.amountPaise).toBe(15000);
    expect(row.baseAmountPaise).toBe(100000);
    expect(row.commissionPercent).toBe(15);
    expect(row.orderNumber).toBe(order.orderNumber);
  });

  test('a marketplace credit shows its own (different) rate', async () => {
    const order = await makeOrder([retailLine(vendorA, 500, 2)]);
    await settle(order);
    const [row] = await txns();
    expect(row.transactionType).toBe('retail_commission_credit');
    expect([row.baseAmountPaise, row.commissionPercent, row.amountPaise]).toEqual([50000, 2, 1000]);
  });

  test('an order with a kit and a marketplace item gives two credits, each with its own base and %', async () => {
    const order = await makeOrder([kitLine(vendorA, 1000, 15), retailLine(vendorA, 400, 2)]);
    await settle(order);
    const rows = await txns();
    const kit = rows.find((r) => r.transactionType === 'kit_commission_credit');
    const retail = rows.find((r) => r.transactionType === 'retail_commission_credit');
    expect([kit.baseAmountPaise, kit.commissionPercent, kit.amountPaise]).toEqual([100000, 15, 15000]);
    expect([retail.baseAmountPaise, retail.commissionPercent, retail.amountPaise]).toEqual([40000, 2, 800]);
  });

  test('two vendors on one order: each credit shows only that vendor\'s sale value', async () => {
    const order = await makeOrder([kitLine(vendorA, 1000, 10), kitLine(vendorB, 300, 10)]);
    await settle(order);
    const rows = await txns();
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => [r.baseAmountPaise, r.commissionPercent, r.amountPaise]).sort((a, b) => b[0] - a[0])).toEqual([
      [100000, 10, 10000],
      [30000, 10, 3000],
    ]);
  });

  test('lines with different rates are blended into the effective %', async () => {
    const order = await makeOrder([kitLine(vendorA, 1000, 10), kitLine(vendorA, 1000, 20)]);
    await settle(order);
    const [row] = await txns();
    expect([row.baseAmountPaise, row.amountPaise, row.commissionPercent]).toEqual([200000, 30000, 15]);
  });

  test('credits written before the ledger stored its working are filled in from the order', async () => {
    const order = await makeOrder([kitLine(vendorA, 800, 15), kitLine(vendorB, 200, 15)]);
    await settle(order);
    // simulate old rows: strip the new fields
    await SchoolLedger.collection.updateMany({ schoolId }, { $unset: { baseAmountPaise: '', commissionPercent: '', orderNumber: '' } });
    const rows = await txns();
    expect(rows.map((r) => [r.orderNumber, r.baseAmountPaise, r.commissionPercent, r.amountPaise]).sort((a, b) => b[1] - a[1])).toEqual([
      [order.orderNumber, 80000, 15, 12000],
      [order.orderNumber, 20000, 15, 3000],
    ]);
  });

  test('an old credit whose order no longer adds up is left as it was (no guessing)', async () => {
    const order = await makeOrder([kitLine(vendorA, 1000, 15)]);
    await settle(order);
    await SchoolLedger.collection.updateMany({ schoolId }, { $unset: { baseAmountPaise: '', commissionPercent: '', orderNumber: '' }, $set: { amountPaise: 99999 } });
    const [row] = await txns();
    expect(row.baseAmountPaise).toBeUndefined();
    expect(row.commissionPercent).toBeUndefined();
    expect(row.amountPaise).toBe(99999);
  });

  test('payouts and other rows are untouched by the enrichment', async () => {
    await SchoolLedger.create({
      schoolId, transactionType: 'payout_debit', amountPaise: -5000, balancePaise: -5000,
      reference: { kind: 'PayoutRequest', id: new mongoose.Types.ObjectId() }, description: 'Payout',
    });
    const [row] = await txns();
    expect(row.transactionType).toBe('payout_debit');
    expect(row.baseAmountPaise).toBeUndefined();
  });

  test('settling twice does not double-credit or double-record', async () => {
    const order = await makeOrder([kitLine(vendorA, 1000, 15)]);
    await settle(order);
    await settle(order);
    const rows = await txns();
    expect(rows).toHaveLength(1);
    expect((await schoolFinanceService.getEarningsSummary(schoolId)).kitEarningsPaise).toBe(15000);
  });
});
