#!/usr/bin/env node
/**
 * Payment / order / finance audit.
 *
 * Reports every way the order book, the payment records and the gateway can
 * disagree. Read-only by default: it opens the database, reads, prints, and
 * exits. It never deletes anything, and it writes nothing at all unless
 * --reconcile is passed explicitly.
 *
 *   node scripts/payment-audit.js                 # report only (safe)
 *   node scripts/payment-audit.js --reconcile     # also ask Razorpay and heal
 *   node scripts/payment-audit.js --limit 25      # cap how many to reconcile
 *
 * --reconcile performs no deletions either. It can only:
 *   - mark a payment captured when Razorpay confirms it was captured,
 *   - activate an order whose money has been confirmed,
 *   - refresh refund statuses from the gateway,
 *   - flag a disagreement for a human.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const RECONCILE = args.includes('--reconcile');
const LIMIT = (() => {
  const i = args.indexOf('--limit');
  return i >= 0 ? Number(args[i + 1]) || 50 : 50;
})();

const rupees = (paise) => `₹${(Number(paise || 0) / 100).toFixed(2)}`;
const pad = (value, width) => String(value).padEnd(width);

const line = (char = '─') => console.log(char.repeat(78));
const heading = (text) => {
  console.log('');
  line();
  console.log(text);
  line();
};

const FULFILLING = ['accepted', 'processed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
const PAID_STATES = ['paid', 'partially_paid', 'refunded', 'partially_refunded'];

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const Order = require('../src/database/models/Order');
  const Payment = require('../src/database/models/Payment');

  console.log(`Connected to ${mongoose.connection.name}`);
  console.log(RECONCILE ? 'Mode: RECONCILE (will write)' : 'Mode: REPORT ONLY (read-only)');

  const orders = await Order.find({}).lean();
  const payments = await Payment.find({}).lean();

  const paymentsByOrder = new Map();
  for (const p of payments) {
    const key = String(p.orderId);
    if (!paymentsByOrder.has(key)) paymentsByOrder.set(key, []);
    paymentsByOrder.get(key).push(p);
  }

  const capturedFor = (order) =>
    (paymentsByOrder.get(String(order._id)) || [])
      .filter((p) => p.status === 'captured')
      .reduce((sum, p) => sum + (p.amountPaise || 0), 0);
  const owedFor = (order) =>
    Math.max(0, (order.totalPaise || 0) - (order.walletAmountPaise || 0));

  // ---------------------------------------------------------------- totals --
  heading('OVERVIEW');
  console.log(`Orders: ${orders.length}   Payments: ${payments.length}`);
  const tally = (rows, field) =>
    rows.reduce((acc, r) => {
      acc[r[field]] = (acc[r[field]] || 0) + 1;
      return acc;
    }, {});
  console.log('Order status  :', JSON.stringify(tally(orders, 'orderStatus')));
  console.log('Payment status:', JSON.stringify(tally(orders, 'paymentStatus')));
  console.log('Gateway rows  :', JSON.stringify(tally(payments, 'status')));

  // --------------------------------------------- fulfilled but not paid for --
  heading('A. IN FULFILMENT WITHOUT CONFIRMED PAYMENT');
  console.log('Orders being worked on, shipped or delivered whose money was never confirmed.');
  console.log('These pay out vendors and schools against revenue that may not exist.\n');
  const fulfilledUnpaid = orders.filter(
    (o) => FULFILLING.includes(o.orderStatus) && !PAID_STATES.includes(o.paymentStatus)
  );
  let sumA = 0;
  for (const o of fulfilledUnpaid) {
    sumA += o.totalPaise || 0;
    const p = (paymentsByOrder.get(String(o._id)) || [])[0] || {};
    console.log(
      `  ${pad(o.orderNumber, 22)} ${pad(o.orderStatus, 12)} ${pad(o.paymentStatus, 10)} ` +
        `${pad(rupees(o.totalPaise), 11)} ${p.gatewayOrderId || '—'}`
    );
  }
  console.log(`  → ${fulfilledUnpaid.length} orders, ${rupees(sumA)}`);

  // -------------------------------------------------- money of unknown state --
  heading('B. PAYMENTS NEVER RESOLVED');
  console.log('Gateway intents that never reached a final state. Until each is checked against');
  console.log('Razorpay, whether the customer was charged is simply unknown.\n');
  const unresolved = payments.filter((p) => ['initiated', 'authorized'].includes(p.status));
  const neverSynced = unresolved.filter((p) => !p.lastSyncedAt);
  console.log(
    `  ${unresolved.length} unresolved, ${rupees(
      unresolved.reduce((s, p) => s + (p.amountPaise || 0), 0)
    )} at stake; ${neverSynced.length} never once checked against the gateway.`
  );

  // ------------------------------------------- cancelled but money collected --
  heading('C. CANCELLED ORDERS THAT MAY HOLD CUSTOMER MONEY');
  console.log('Cancelled by the unpaid-order sweeper, but with a live gateway intent. If the');
  console.log('customer did pay, the money is at Razorpay and the order is gone.\n');
  const sweptWithIntent = orders.filter(
    (o) =>
      o.orderStatus === 'cancelled' &&
      (paymentsByOrder.get(String(o._id)) || []).some(
        (p) => p.gateway === 'razorpay' && p.status === 'initiated'
      )
  );
  const sweptSum = sweptWithIntent.reduce((s, o) => s + (o.totalPaise || 0), 0);
  console.log(`  ${sweptWithIntent.length} cancelled orders carry an unresolved Razorpay intent (${rupees(sweptSum)}).`);
  for (const o of sweptWithIntent.slice(0, 15)) {
    const p = (paymentsByOrder.get(String(o._id)) || [])[0] || {};
    console.log(
      `  ${pad(o.orderNumber, 22)} ${pad(rupees(o.totalPaise), 11)} ${p.gatewayOrderId || '—'} ` +
        `"${(o.cancellation && o.cancellation.reason) || ''}"`
    );
  }
  if (sweptWithIntent.length > 15) console.log(`  …and ${sweptWithIntent.length - 15} more`);

  // ------------------------------------------------------ unsettled refunds --
  heading('D. REFUNDS CLAIMED BUT NOT SETTLED');
  console.log('Orders marked refunded whose refunds the gateway has not confirmed as paid out.\n');
  let unsettled = 0;
  for (const p of payments) {
    for (const r of p.refunds || []) {
      if (r.status !== 'processed') {
        unsettled += 1;
        const o = orders.find((x) => String(x._id) === String(p.orderId));
        console.log(
          `  ${pad(o ? o.orderNumber : '?', 22)} ${pad(r.status, 11)} ${pad(rupees(r.amountPaise), 11)} ${r.refundId}`
        );
      }
    }
  }
  console.log(`  → ${unsettled} refund(s) not confirmed settled.`);

  // ------------------------------------------------ order vs payment ledger --
  heading('E. ORDER BOOK vs PAYMENT LEDGER');
  const claimsPaidNoMoney = [];
  const moneyNotCredited = [];
  for (const o of orders) {
    const captured = capturedFor(o);
    const owed = owedFor(o);
    if (PAID_STATES.includes(o.paymentStatus) && captured < owed && o.paymentMethod !== 'cod') {
      claimsPaidNoMoney.push({ o, captured, owed });
    }
    if (!PAID_STATES.includes(o.paymentStatus) && owed > 0 && captured >= owed) {
      moneyNotCredited.push({ o, captured, owed });
    }
  }
  console.log(`  Orders marked paid with no matching capture : ${claimsPaidNoMoney.length}`);
  for (const x of claimsPaidNoMoney.slice(0, 10)) {
    console.log(
      `    ${pad(x.o.orderNumber, 22)} owed ${pad(rupees(x.owed), 11)} captured ${rupees(x.captured)}`
    );
  }
  console.log(`  Orders holding money but not marked paid    : ${moneyNotCredited.length}`);
  for (const x of moneyNotCredited.slice(0, 10)) {
    console.log(
      `    ${pad(x.o.orderNumber, 22)} owed ${pad(rupees(x.owed), 11)} captured ${rupees(x.captured)} ` +
        `(${x.o.orderStatus}/${x.o.paymentStatus})`
    );
  }

  // ----------------------------------------------------- webhook liveness ---
  heading('F. WEBHOOK DELIVERY');
  const WebhookEvent = require('../src/database/models/WebhookEvent');
  const webhookCount = await WebhookEvent.countDocuments();
  const lastEvent = await WebhookEvent.findOne().sort({ 'audit.createdAt': -1 }).lean();
  console.log(`  Webhook events recorded: ${webhookCount}`);
  if (webhookCount === 0) {
    console.log('  ⚠ No Razorpay webhook has ever been processed.');
    console.log('    Payment confirmation depends entirely on the customer\'s browser.');
    console.log('    Set RAZORPAY_WEBHOOK_SECRET and register the endpoint in the Razorpay');
    console.log('    dashboard: POST <api-base>/api/webhooks/razorpay');
    console.log('    Events: payment.captured, payment.failed, payment.authorized, order.paid,');
    console.log('            refund.created, refund.processed, refund.failed');
  } else {
    console.log(`  Most recent: ${lastEvent && lastEvent.eventType} at ${lastEvent && lastEvent.audit && lastEvent.audit.createdAt}`);
  }

  // ------------------------------------------------------------- reconcile --
  if (RECONCILE) {
    heading('RECONCILING AGAINST RAZORPAY');
    const reconciliationService = require('../src/modules/orders/services/reconciliation.service');
    const paymentGateway = require('../src/services/paymentGateway');
    if (!paymentGateway.isRazorpayEnabled()) {
      console.log('  Razorpay is not configured here; nothing to reconcile.');
    } else {
      const result = await reconciliationService.sweep({ limit: LIMIT, staleMinutes: 0 });
      console.log(`  Checked ${result.checked}, recovered ${result.recovered}, flagged ${result.mismatched}.`);
      const mismatches = await reconciliationService.listMismatches({ limit: 100 });
      console.log(`  ${mismatches.length} payment(s) now need a human decision.`);
      for (const m of mismatches) {
        console.log(`    ${m.reconciliation.code}: ${m.reconciliation.detail}`);
      }
    }
  } else {
    heading('NEXT STEP');
    console.log('  This run changed nothing. To have the server ask Razorpay what really');
    console.log('  happened to the payments in sections B and C, and heal what it safely can:');
    console.log('');
    console.log('      node scripts/payment-audit.js --reconcile');
    console.log('');
    console.log('  It never deletes. Anything it cannot resolve is flagged for review in the');
    console.log('  admin Orders page rather than guessed at.');
  }

  await mongoose.disconnect();
  console.log('\nDone.');
})().catch((error) => {
  console.error('Audit failed:', error.message);
  process.exit(1);
});
