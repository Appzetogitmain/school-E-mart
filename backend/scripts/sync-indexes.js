/**
 * Build any missing Mongo indexes.
 *
 * `autoIndex` is deliberately off in production (src/config/database.js), so an index
 * added to a schema does not exist on the live database until something creates it.
 * The parent homework feed shipped without one for exactly that reason: it declared no
 * usable index and, in production, would not have grown one on its own.
 *
 * Safe to re-run. `syncIndexes` creates what is missing and drops indexes the schema no
 * longer declares, so run it from a checkout that matches what is deployed.
 *
 *   node scripts/sync-indexes.js            # every registered model
 *   node scripts/sync-indexes.js LmsAssignment
 *   node scripts/sync-indexes.js --dry-run  # report only, change nothing
 */
const dns = require('dns');

// Match server bootstrap — Atlas SRV lookups fail on some local DNS resolvers.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/database/connection');
require('../src/database/modelRegistry');

const run = async () => {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const only = args.filter((arg) => !arg.startsWith('--'));

  await connectDB();

  const names = only.length ? only : mongoose.modelNames();
  let created = 0;
  let failed = 0;

  for (const name of names) {
    let model;
    try {
      model = mongoose.model(name);
    } catch {
      console.error(`  ! ${name}: no such model`);
      failed += 1;
      continue;
    }

    try {
      const existing = new Set((await model.collection.indexes()).map((index) => index.name));
      const declared = model.schema.indexes();

      if (dryRun) {
        const missing = declared.filter((entry) => {
          const key = entry[0];
          const options = entry[1] || {};
          const guessed =
            options.name ||
            Object.entries(key)
              .map(([field, direction]) => `${field}_${direction}`)
              .join('_');
          return !existing.has(guessed);
        });
        if (missing.length) {
          console.log(`  ~ ${name}: ${missing.length} index(es) would be created`);
          missing.forEach((entry) => console.log(`      ${JSON.stringify(entry[0])}`));
        }
        continue;
      }

      await model.syncIndexes();
      const after = await model.collection.indexes();
      const added = after.length - existing.size;
      if (added > 0) {
        created += added;
        console.log(`  + ${name}: ${added} index(es) created (${after.length} total)`);
      }
    } catch (error) {
      failed += 1;
      console.error(`  ! ${name}: ${error.message}`);
    }
  }

  console.log(
    dryRun
      ? '\nDry run complete — nothing was changed.'
      : `\nDone. ${created} index(es) created across ${names.length} model(s), ${failed} failure(s).`
  );

  await disconnectDB();
  process.exit(failed ? 1 : 0);
};

run().catch(async (error) => {
  console.error('Index sync failed:', error);
  try {
    await disconnectDB();
  } catch {
    // already down
  }
  process.exit(1);
});
