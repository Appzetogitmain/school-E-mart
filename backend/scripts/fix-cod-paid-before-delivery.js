#!/usr/bin/env node
/**
 * One-off data fix: Cash on Delivery orders that were marked paid before delivery.
 *
 * Cause: `scripts/payment-audit.js --auto-heal` used to treat the COD Payment row (recorded
 * as 'captured' at placement although no cash has moved) as real money and set the order's
 * paymentStatus to 'paid' with the note "Payment confirmed from captured funds". That
 * made invoices and vendor screens claim payment that had not been collected.
 *
 * DRY RUN BY DEFAULT: it only prints what it would change. Nothing is written without --apply.
 *
 *   node scripts/fix-cod-paid-before-delivery.js            # list affected orders (safe)
 *   node scripts/fix-cod-paid-before-delivery.js --apply    # set them back to 'pending'
 *
 * Safe on purpose:
 *   - only COD orders that are NOT delivered/returned/cancelled (a delivered COD order is
 *     legitimately paid: the cash was collected),
 *   - only orders carrying the auto-heal note (clear evidence of this bug),
 *   - never touches orders fully covered by wallet money (those really are paid),
 *   - never deletes anything; it adds a statusHistory note explaining the revert.
 * Orders that are COD + paid + not delivered but WITHOUT the marker are only listed for a
 * human to look at.
 *
 * Take a database backup before running with --apply.
 */
const HEAL_NOTE = 'Payment confirmed from captured funds';
const REVERT_NOTE = 'Reverted to pending: COD payment is collected on delivery (was wrongly auto-marked paid)';
const NOT_YET_DELIVERED = { $nin: ['delivered', 'returned', 'cancelled'] };

const isWalletCovered = (order) =>
  Number(order.totalPaise) > 0 && Number(order.walletAmountPaise || 0) >= Number(order.totalPaise);

const hasHealMarker = (order) =>
  (order.statusHistory || []).some((entry) => entry && entry.note === HEAL_NOTE);

/** @returns {Promise<{ affected: object[], needsReview: object[] }>} */
const findWronglyPaidCod = async (Order) => {
  const candidates = await Order.find({
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    orderStatus: NOT_YET_DELIVERED,
  })
    .select('orderNumber orderStatus paymentStatus totalPaise walletAmountPaise statusHistory')
    .lean();

  const affected = [];
  const needsReview = [];
  for (const order of candidates) {
    if (isWalletCovered(order)) continue;
    (hasHealMarker(order) ? affected : needsReview).push(order);
  }
  return { affected, needsReview };
};

/** Sets the given orders back to 'pending' (only if they are still paid). Returns how many changed. */
const revertToPending = async (Order, orders) => {
  let changed = 0;
  for (const order of orders) {
    const result = await Order.updateOne(
      { _id: order._id, paymentMethod: 'cod', paymentStatus: 'paid', orderStatus: NOT_YET_DELIVERED },
      {
        $set: { paymentStatus: 'pending' },
        $push: { statusHistory: { status: order.orderStatus, at: new Date(), note: REVERT_NOTE } },
      }
    );
    changed += result.modifiedCount || 0;
  }
  return changed;
};

module.exports = { findWronglyPaidCod, revertToPending, HEAL_NOTE, REVERT_NOTE };

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const APPLY = process.argv.includes('--apply');

  (async () => {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI is not set.');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    const Order = require('../src/database/models/Order');
    console.log(`Connected to database "${mongoose.connection.name}"`);
    console.log(APPLY ? 'Mode: APPLY (will write)' : 'Mode: DRY RUN (read-only)');

    const { affected, needsReview } = await findWronglyPaidCod(Order);
    console.log(`\nCOD orders wrongly marked paid before delivery: ${affected.length}`);
    for (const o of affected) console.log(`  ${o.orderNumber}  ${o.orderStatus}  total ${(o.totalPaise / 100).toFixed(2)}`);

    console.log(`\nCOD + paid + not delivered but WITHOUT the auto-heal note (review by hand, not changed): ${needsReview.length}`);
    for (const o of needsReview) console.log(`  ${o.orderNumber}  ${o.orderStatus}  total ${(o.totalPaise / 100).toFixed(2)}`);

    if (APPLY && affected.length) {
      const changed = await revertToPending(Order, affected);
      console.log(`\nReverted ${changed} order(s) to pending.`);
    } else if (!APPLY && affected.length) {
      console.log('\nNothing changed. Re-run with --apply (after a backup) to fix these.');
    }

    await mongoose.disconnect();
  })().catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
}
