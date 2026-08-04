/**
 * Wipes every collection in the database EXCEPT the super-admin (role: 'admin')
 * User docs and their AdminProfile records. Everything else — schools, teachers,
 * students, parents, classes, orders, LMS content, carts, notices, etc. — is
 * permanently deleted.
 *
 * This is DESTRUCTIVE and IRREVERSIBLE. It defaults to a dry run that only
 * prints what would be deleted. Nothing is deleted until you pass --yes AND
 * type the database name back at the confirmation prompt.
 *
 * Usage:
 *   node scripts/reset-database.js            # dry run — reports counts only
 *   node scripts/reset-database.js --yes       # actually deletes (after confirmation prompt)
 */
const dns = require('dns');

// Match server bootstrap — Atlas SRV lookups fail on some local DNS resolvers.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');
const readline = require('readline');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/database/connection');
const models = require('../src/database/modelRegistry');
const { ROLES } = require('../src/constants/roles');

const EXECUTE = process.argv.includes('--yes');

const prompt = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

async function main() {
  await connectDB(env.MONGODB_URI);
  const conn = mongoose.connection;
  console.log(`Connected: host="${conn.host}" db="${conn.name}"`);

  const User = models.User;
  const AdminProfile = models.AdminProfile;

  const keepAdmins = await User.find({ role: ROLES.SUPER_ADMIN }).select('_id email refId name').lean();
  if (!keepAdmins.length) {
    throw new Error(
      'No admin (role="admin") user found — refusing to run, this would leave nothing to log in with. ' +
        'Seed one first: node scripts/seed-superadmin.js'
    );
  }
  const keepAdminIds = keepAdmins.map((a) => a._id);

  console.log(`\nWill KEEP ${keepAdmins.length} admin user(s):`);
  keepAdmins.forEach((a) => console.log(`  - ${a.name} <${a.email}> (${a.refId})`));

  const modelEntries = Object.entries(models);

  const plan = [];
  for (const [name, Model] of modelEntries) {
    let filter = {};
    if (name === 'User') filter = { _id: { $nin: keepAdminIds } };
    else if (name === 'AdminProfile') filter = { userId: { $nin: keepAdminIds } };

    const count = await Model.countDocuments(filter);
    if (count) plan.push({ name, Model, filter, count });
  }

  const totalToDelete = plan.reduce((sum, p) => sum + p.count, 0);

  console.log(`\n${EXECUTE ? 'ABOUT TO DELETE' : 'DRY RUN — would delete'} from ${plan.length} collections:\n`);
  plan.forEach((p) => console.log(`  ${p.name}: ${p.count}`));
  console.log(`\nTotal documents: ${totalToDelete}`);

  if (!EXECUTE) {
    console.log('\nNo changes made. Re-run with --yes to actually execute.');
    return;
  }

  const answer = await prompt(
    `\nThis PERMANENTLY deletes ${totalToDelete} documents from "${conn.name}" on ${conn.host}.\n` +
      `Type the database name ("${conn.name}") to confirm, anything else cancels: `
  );

  if (answer.trim() !== conn.name) {
    console.log('\nConfirmation did not match. Aborted — nothing was deleted.');
    return;
  }

  let totalDeleted = 0;
  for (const { name, Model, filter } of plan) {
    const result = await Model.deleteMany(filter);
    console.log(`  ${name}: deleted ${result.deletedCount}`);
    totalDeleted += result.deletedCount;
  }

  console.log(`\nDone. Deleted ${totalDeleted} documents. Kept ${keepAdmins.length} admin user(s).`);
}

main()
  .catch((error) => {
    console.error('Failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
