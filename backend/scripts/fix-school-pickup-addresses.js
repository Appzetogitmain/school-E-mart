#!/usr/bin/env node
/**
 * One-off data fix: school-pickup orders stored with the made-up "Indore, 452018" address.
 *
 * Cause: the app filled a missing city/pincode with "Indore / Madhya Pradesh / 452018" and the
 * server stored the client's address as-is, so every school-pickup order showed an Indore
 * address whatever the school's real location. New orders are fixed in the code (the server
 * now uses the school's own address); this repairs the existing ones.
 *
 * DRY RUN BY DEFAULT: it only prints what it would change. Nothing is written without --apply.
 *
 *   node scripts/fix-school-pickup-addresses.js            # list affected orders (safe)
 *   node scripts/fix-school-pickup-addresses.js --apply    # correct their address
 *
 * Safe on purpose:
 *   - only orders with deliveryType 'school' that point at a school (schoolIdForPickup),
 *   - only when the stored address carries the fake defaults (city "Indore" AND pincode 452018),
 *   - the new address is the school's own record, the recipient name/phone are kept,
 *   - nothing is deleted. Home-delivery orders are never touched (their address is the
 *     customer's own; a real Indore customer is not affected either).
 *
 * Take a database backup before running with --apply.
 */
const FAKE_CITY = 'indore';
const FAKE_PINCODE = '452018';

const hasFakeDefaults = (address = {}) =>
  String(address.city || '').trim().toLowerCase() === FAKE_CITY &&
  String(address.pinCode || address.pincode || '').trim() === FAKE_PINCODE;

/** The address a school-pickup order should carry, built from the school's record. */
const buildSchoolPickupAddress = (school, currentAddress = {}) => {
  const schoolAddress = school.address || {};
  const line1 = [school.name, schoolAddress.line1].filter(Boolean).join(', ');
  return {
    ...currentAddress,
    line1,
    address: line1,
    line2: schoolAddress.line2 || '',
    city: schoolAddress.city || '',
    state: schoolAddress.state || '',
    country: schoolAddress.country || 'India',
    pinCode: schoolAddress.pinCode || '',
    addressType: 'school',
  };
};

/** @returns {Promise<{ affected: {order: object, newAddress: object}[], skipped: object[] }>} */
const findOrdersWithFakeSchoolAddress = async ({ Order, School }) => {
  const orders = await Order.find({ deliveryType: 'school', schoolIdForPickup: { $exists: true, $ne: null } })
    .select('orderNumber orderStatus address schoolIdForPickup')
    .lean();

  const affected = [];
  const skipped = [];
  for (const order of orders) {
    if (!hasFakeDefaults(order.address)) continue;
    const school = await School.findById(order.schoolIdForPickup).select('name address').lean();
    if (!school) {
      skipped.push({ order, reason: 'school record not found' });
      continue;
    }
    affected.push({ order, newAddress: buildSchoolPickupAddress(school, order.address) });
  }
  return { affected, skipped };
};

const applyFixes = async ({ Order }, affected) => {
  let changed = 0;
  for (const { order, newAddress } of affected) {
    const result = await Order.updateOne(
      // still carries the fake defaults: a re-run or a concurrent edit changes nothing
      { _id: order._id, 'address.city': order.address.city, 'address.pinCode': order.address.pinCode },
      { $set: { address: newAddress } }
    );
    changed += result.modifiedCount || 0;
  }
  return changed;
};

module.exports = { findOrdersWithFakeSchoolAddress, applyFixes, buildSchoolPickupAddress, hasFakeDefaults };

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
    const School = require('../src/database/models/School');
    console.log(`Connected to database "${mongoose.connection.name}"`);
    console.log(APPLY ? 'Mode: APPLY (will write)' : 'Mode: DRY RUN (read-only)');

    const { affected, skipped } = await findOrdersWithFakeSchoolAddress({ Order, School });
    console.log(`\nSchool-pickup orders carrying the fake Indore / 452018 address: ${affected.length}`);
    for (const { order, newAddress } of affected) {
      console.log(`  ${order.orderNumber} (${order.orderStatus}): "${order.address.line1}, ${order.address.city} ${order.address.pinCode}"  ->  "${newAddress.line1}, ${newAddress.city} ${newAddress.pinCode}"`);
    }
    if (skipped.length) {
      console.log(`\nSkipped (cannot be fixed automatically): ${skipped.length}`);
      for (const { order, reason } of skipped) console.log(`  ${order.orderNumber}: ${reason}`);
    }

    if (APPLY && affected.length) {
      console.log(`\nCorrected ${await applyFixes({ Order }, affected)} order(s).`);
    } else if (!APPLY && affected.length) {
      console.log('\nNothing changed. Re-run with --apply (after a backup) to fix these.');
    }
    await mongoose.disconnect();
  })().catch((error) => {
    console.error('Failed:', error.message);
    process.exit(1);
  });
}
