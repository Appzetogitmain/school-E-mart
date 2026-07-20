/**
 * One-off backfill for the school login gate.
 *
 * School admins used to be able to sign in the moment they registered — nothing
 * checked the school's partnerStatus. Now that login requires an 'active' school,
 * every school still sitting at 'prospect' would be locked out on deploy even
 * though it has been operating normally. Approve those so the gate applies only
 * to registrations made from here on.
 *
 * Schools that were explicitly REJECTED are left alone. A rejection is stored as
 * partnerStatus 'prospect' plus an inactive admin user, so approving every
 * prospect blindly would silently reinstate them.
 *
 * Usage:
 *   node scripts/backfill-school-approval.js --dry-run
 *   node scripts/backfill-school-approval.js
 */
const dns = require('dns');

// Match server bootstrap — Atlas SRV lookups fail on some local DNS resolvers.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../src/database/connection');
const School = require('../src/database/models/School');
const User = require('../src/database/models/User');

const DRY_RUN = process.argv.includes('--dry-run');

const run = async () => {
  await connectDB();

  const prospects = await School.find({
    partnerStatus: 'prospect',
    'softDelete.isDeleted': { $ne: true },
  }).lean();

  if (!prospects.length) {
    console.log('No prospect schools found — nothing to backfill.');
    return;
  }

  const ids = prospects.map((s) => s._id);
  const admins = await User.find({ tenantSchoolId: { $in: ids }, role: 'school' }).lean();

  const rejectedSchoolIds = new Set(
    admins.filter((a) => a.status === 'inactive').map((a) => String(a.tenantSchoolId))
  );

  const toApprove = prospects.filter((s) => !rejectedSchoolIds.has(String(s._id)));
  const skipped = prospects.filter((s) => rejectedSchoolIds.has(String(s._id)));

  console.log(`Prospect schools:      ${prospects.length}`);
  console.log(`  -> to approve:       ${toApprove.length}`);
  console.log(`  -> skipped (rejected): ${skipped.length}`);

  skipped.forEach((s) => console.log(`     skip  ${s.schoolRefNo}  ${s.name}`));
  toApprove.forEach((s) => console.log(`     approve  ${s.schoolRefNo}  ${s.name}`));

  if (DRY_RUN) {
    console.log('\nDry run — no changes written.');
    return;
  }

  if (!toApprove.length) {
    console.log('\nNothing to write.');
    return;
  }

  const approveIds = toApprove.map((s) => s._id);
  const schoolResult = await School.updateMany(
    { _id: { $in: approveIds } },
    { $set: { partnerStatus: 'active' } }
  );
  const userResult = await User.updateMany(
    { tenantSchoolId: { $in: approveIds }, role: 'school', status: { $ne: 'inactive' } },
    { $set: { status: 'active' } }
  );

  console.log(`\nSchools updated: ${schoolResult.modifiedCount}`);
  console.log(`Admin users updated: ${userResult.modifiedCount}`);
};

run()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB();
  });
