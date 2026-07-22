const mongoose = require('mongoose');
const settlementService = require('../../src/modules/vendor/services/settlement.service');
const { createVendorUser } = require('./helpers');
const User = require('../../src/database/models/User');
const Order = require('../../src/database/models/Order');
const SchoolLedger = require('../../src/database/models/SchoolLedger');
const PlatformLedger = require('../../src/database/models/PlatformLedger');

// A kit line item snapshots its commission split at order time. On a delivered
// kit order the platform keeps admin%, the school earns school%, and the vendor
// is paid the remainder — this proves that three-way split end to end.
describe('kit order settlement (3-way split)', () => {
  let vendorId;
  let schoolId;
  let orderId;

  beforeEach(async () => {
    const { profile } = await createVendorUser({ approvalStatus: 'approved' });
    vendorId = profile._id;
    schoolId = new mongoose.Types.ObjectId();

    const customer = await User.create({
      refId: 'SEM-P-KIT1',
      role: 'parent',
      status: 'active',
      name: 'Kit Customer',
      phone: '9123456700',
    });

    // ₹1000 kit line, admin 10% / school 15% -> vendor 75%.
    const order = await Order.create({
      orderNumber: `ORD${Date.now()}0`,
      userId: customer._id,
      audience: 'parent',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          vendorId,
          schoolId,
          kitId: new mongoose.Types.ObjectId(),
          commission: { adminPercent: 10, schoolPercent: 15 },
          name: 'Books Kit',
          sku: 'KIT-TEST-1',
          pricePaise: 100000,
          mrpPaise: 100000,
          quantity: 1,
          taxPaise: 0,
          lineTotalPaise: 100000,
        },
      ],
      vendorIds: [vendorId],
      subtotalPaise: 100000,
      taxPaise: 0,
      discountPaise: 0,
      platformFeePaise: 0,
      deliveryChargePaise: 0,
      handlingChargePaise: 0,
      totalPaise: 100000,
      address: { line1: 'Test' },
      deliveryType: 'home',
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      deliveredAt: new Date(),
      statusHistory: [{ status: 'delivered', at: new Date() }],
      placedAt: new Date(),
    });
    orderId = order._id;
  });

  test('pays the vendor the remainder after admin and school cuts', async () => {
    const entry = await settlementService.recordOrderSettlement(vendorId, orderId);
    expect(entry.transactionType).toBe('order_credit');
    expect(entry.amountPaise).toBe(75000); // ₹1000 - 10% - 15%
  });

  test('credits the school its commission', async () => {
    await settlementService.recordOrderSettlement(vendorId, orderId);
    const schoolEntry = await SchoolLedger.findOne({ schoolId }).lean();
    expect(schoolEntry).not.toBeNull();
    expect(schoolEntry.transactionType).toBe('kit_commission_credit');
    expect(schoolEntry.amountPaise).toBe(15000);
  });

  test('credits the platform its commission', async () => {
    await settlementService.recordOrderSettlement(vendorId, orderId);
    const platformEntry = await PlatformLedger.findOne({ 'reference.id': orderId }).lean();
    expect(platformEntry).not.toBeNull();
    expect(platformEntry.amountPaise).toBe(10000);
    expect(String(platformEntry.source.vendorId)).toBe(String(vendorId));
  });

  test('is idempotent — a second settle does not double-credit', async () => {
    await settlementService.recordOrderSettlement(vendorId, orderId);
    await settlementService.recordOrderSettlement(vendorId, orderId);
    const schoolEntries = await SchoolLedger.find({ schoolId }).lean();
    const platformEntries = await PlatformLedger.find({ 'reference.id': orderId }).lean();
    expect(schoolEntries).toHaveLength(1);
    expect(platformEntries).toHaveLength(1);
  });
});
