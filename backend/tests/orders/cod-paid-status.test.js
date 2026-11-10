const { spawnSync } = require('child_process');
const path = require('path');
const mongoose = require('mongoose');
const Order = require('../../src/database/models/Order');
const Payment = require('../../src/database/models/Payment');
const orderService = require('../../src/modules/orders/services/order.service');
const invoiceService = require('../../src/modules/orders/services/invoice.service');
const {
  findWronglyPaidCod,
  revertToPending,
  HEAL_NOTE,
} = require('../../scripts/fix-cod-paid-before-delivery');
const { createParentUser, seedCartForUser, defaultAddress } = require('./helpers');

// Client bug: a COD order's invoice said PAID. These tests pin the backend facts the fix
// relies on, plus the data-repair script and the audit script's COD handling.
describe('Cash on Delivery payment status', () => {
  test('a freshly placed COD order stays unpaid (invoice payload says pending + COD)', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);
    const order = await orderService.createOrder(
      user._id,
      'parent',
      { address: defaultAddress, deliveryType: 'home', paymentMethod: 'cod' },
      { userId: user._id, role: 'parent' }
    );

    const stored = await Order.findById(order._id).lean();
    expect(stored.paymentMethod).toBe('cod');
    expect(stored.paymentStatus).toBe('pending');

    // ...even though a COD Payment row is recorded as 'captured' at placement. That row is
    // why the old audit auto-heal wrongly flipped COD orders to paid.
    const payment = await Payment.findOne({ orderId: order._id }).lean();
    expect(payment.method).toBe('cod');
    expect(payment.status).toBe('captured');

    const invoice = await invoiceService.buildInvoicePayload(stored);
    expect(invoice.paymentMethod).toBe('cod');
    expect(invoice.paymentStatus).toBe('pending');
    expect(invoice.orderStatus).toBe('placed');
  });

  test('COD becomes paid only when the order is delivered', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);
    const order = await orderService.createOrder(
      user._id,
      'parent',
      { address: defaultAddress, deliveryType: 'home', paymentMethod: 'cod' },
      { userId: user._id, role: 'parent' }
    );

    for (const status of ['accepted', 'processed', 'packed', 'shipped', 'out_for_delivery']) {
      await orderService.transitionStatus(order._id, { status }, { userId: user._id });
      expect((await Order.findById(order._id).lean()).paymentStatus).toBe('pending');
    }
    await orderService.transitionStatus(order._id, { status: 'delivered' }, { userId: user._id });
    expect((await Order.findById(order._id).lean()).paymentStatus).toBe('paid');
  });
});

describe('fix-cod-paid-before-delivery script', () => {
  let user;

  const makeOrder = (overrides = {}) =>
    Order.create({
      orderNumber: `ORD${Date.now()}${Math.floor(Math.random() * 100000)}`.slice(0, 20),
      userId: user._id,
      audience: 'parent',
      items: [],
      vendorIds: [],
      subtotalPaise: 41000,
      taxPaise: 0,
      discountPaise: 0,
      platformFeePaise: 0,
      deliveryChargePaise: 0,
      handlingChargePaise: 0,
      totalPaise: 41000,
      walletAmountPaise: 0,
      address: { name: 'A', phone: '9876500011', line1: 'A1', city: 'Indore', pinCode: '452001' },
      deliveryType: 'home',
      paymentMethod: 'cod',
      paymentStatus: 'paid',
      orderStatus: 'placed',
      statusHistory: [{ status: 'placed', at: new Date(), note: HEAL_NOTE }],
      ...overrides,
    });

  beforeEach(async () => {
    user = await createParentUser();
  });

  test('finds only COD orders wrongly paid before delivery, and reverts only those', async () => {
    const wrong = await makeOrder({ orderStatus: 'shipped' });
    const delivered = await makeOrder({ orderStatus: 'delivered' }); // cash was collected: legitimately paid
    const walletPaid = await makeOrder({ walletAmountPaise: 41000 }); // wallet covered everything
    const online = await makeOrder({ paymentMethod: 'online' }); // not COD
    const unmarked = await makeOrder({ statusHistory: [] }); // no heal note: human review only
    const cancelled = await makeOrder({ orderStatus: 'cancelled' });

    const { affected, needsReview } = await findWronglyPaidCod(Order);
    expect(affected.map((o) => String(o._id))).toEqual([String(wrong._id)]);
    expect(needsReview.map((o) => String(o._id))).toEqual([String(unmarked._id)]);

    expect(await revertToPending(Order, affected)).toBe(1);

    expect((await Order.findById(wrong._id).lean()).paymentStatus).toBe('pending');
    const history = (await Order.findById(wrong._id).lean()).statusHistory;
    expect(history[history.length - 1].note).toMatch(/Reverted to pending/);
    for (const untouched of [delivered, walletPaid, online, unmarked, cancelled]) {
      expect((await Order.findById(untouched._id).lean()).paymentStatus).toBe('paid');
    }

    // running it again changes nothing
    expect((await findWronglyPaidCod(Order)).affected).toHaveLength(0);
  });
});

describe('payment-audit script and COD', () => {
  const runAudit = () => {
    const { host, port, name } = mongoose.connection;
    const uri = `mongodb://${host}:${port}/${name}`;
    expect(uri).toMatch(/^mongodb:\/\/(127\.0\.0\.1|localhost):\d+\//); // never the real database
    const result = spawnSync(process.execPath, ['scripts/payment-audit.js'], {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, MONGODB_URI: uri },
      encoding: 'utf8',
      timeout: 60000,
    });
    return `${result.stdout}\n${result.stderr}`;
  };

  test('COD order with its placement "capture" is NOT reported as money-not-credited, an online one is', async () => {
    const user = await createParentUser();
    const base = {
      userId: user._id,
      audience: 'parent',
      items: [],
      vendorIds: [],
      subtotalPaise: 50000,
      taxPaise: 0,
      discountPaise: 0,
      platformFeePaise: 0,
      deliveryChargePaise: 0,
      handlingChargePaise: 0,
      totalPaise: 50000,
      walletAmountPaise: 0,
      address: { name: 'A', phone: '9876500011', line1: 'A1', city: 'Indore', pinCode: '452001' },
      deliveryType: 'home',
      paymentStatus: 'pending',
      orderStatus: 'placed',
    };
    const cod = await Order.create({ ...base, orderNumber: 'ORD8000000001', paymentMethod: 'cod' });
    await Payment.create({
      orderId: cod._id, userId: user._id, amountPaise: 50000, currency: 'INR', method: 'cod',
      idempotencyKey: 'cod-key-1', gateway: 'internal', status: 'captured', amountCapturedPaise: 50000,
    });

    let output = runAudit();
    expect(output).toContain('Orders holding money but not marked paid    : 0');

    const online = await Order.create({ ...base, orderNumber: 'ORD8000000002', paymentMethod: 'online' });
    await Payment.create({
      orderId: online._id, userId: user._id, amountPaise: 50000, currency: 'INR', method: 'card',
      idempotencyKey: 'online-key-1', gateway: 'razorpay', gatewayOrderId: 'order_X', gatewayPaymentId: 'pay_X',
      status: 'captured', amountCapturedPaise: 50000,
    });

    output = runAudit();
    expect(output).toContain('Orders holding money but not marked paid    : 1');
    expect(output).toContain('ORD8000000002');
    expect(output).not.toContain('ORD8000000001  ');
  });
});
