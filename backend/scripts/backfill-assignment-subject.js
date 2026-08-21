/**
 * Backfill `subject` on homework created before it became a field on the assignment.
 *
 * Homework used to hang off an LmsCourse, and the subject lived on that course. The
 * course-less redesign moved `subject` onto LmsAssignment itself and made `courseId`
 * optional, but existing rows were never migrated: assignments written before the
 * change carry a courseId and no `subject`, while ones written after carry a `subject`
 * and no courseId.
 *
 * Anything reading `assignment.subject` therefore sees nothing for the older half of
 * the data — the subject shows blank on the teacher's homework list, and any filter or
 * grouping on subject silently skips every pre-redesign assignment.
 *
 * This copies each such assignment's subject down from its course. Idempotent: rows
 * that already have a subject are left alone, so it is safe to re-run.
 *
 *   node scripts/backfill-assignment-subject.js --dry-run   # report only (default)
 *   node scripts/backfill-assignment-subject.js --apply     # write
 */
const dns = require('dns');

// Match server bootstrap — Atlas SRV lookups fail on some local DNS resolvers.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, disconnectDB } = require('../src/database/connection');
const LmsAssignment = require('../src/database/models/LmsAssignment');
const LmsCourse = require('../src/database/models/LmsCourse');

const MISSING_SUBJECT = {
  $or: [{ subject: { $exists: false } }, { subject: null }, { subject: '' }],
};

const run = async () => {
  const apply = process.argv.includes('--apply');

  await connectDB();

  const stale = await LmsAssignment.find({
    'softDelete.isDeleted': { $ne: true },
    ...MISSING_SUBJECT,
  })
    .select('_id title courseId classGrade')
    .lean();

  if (!stale.length) {
    console.log('Nothing to do — every assignment already carries a subject.');
    await disconnectDB();
    return;
  }

  const courseIds = [...new Set(stale.map((a) => String(a.courseId)).filter((id) => id && id !== 'null'))];
  const courses = await LmsCourse.find({ _id: { $in: courseIds } }).select('subject').lean();
  const subjectByCourse = new Map(courses.map((c) => [String(c._id), c.subject]));

  const updates = [];
  const skipped = [];
  for (const assignment of stale) {
    const subject = subjectByCourse.get(String(assignment.courseId));
    if (subject) updates.push({ assignment, subject });
    else skipped.push(assignment);
  }

  const tally = {};
  updates.forEach(({ subject }) => { tally[subject] = (tally[subject] || 0) + 1; });

  console.log(`assignments missing a subject : ${stale.length}`);
  console.log(`  recoverable from the course : ${updates.length}`);
  console.log(`  left as-is (no course/subject): ${skipped.length}`);
  Object.entries(tally)
    .sort((a, b) => b[1] - a[1])
    .forEach(([subject, n]) => console.log(`    ${JSON.stringify(subject)} -> ${n}`));

  if (!apply) {
    console.log('\nDry run — nothing written. Re-run with --apply to commit these changes.');
    await disconnectDB();
    return;
  }

  const result = await LmsAssignment.bulkWrite(
    updates.map(({ assignment, subject }) => ({
      updateOne: {
        filter: { _id: assignment._id, ...MISSING_SUBJECT },
        update: { $set: { subject } },
      },
    })),
    { ordered: false }
  );

  console.log(`\nmatched ${result.matchedCount}, modified ${result.modifiedCount}`);

  const remaining = await LmsAssignment.countDocuments({
    'softDelete.isDeleted': { $ne: true },
    ...MISSING_SUBJECT,
  });
  console.log(`assignments still without a subject: ${remaining}`);

  await disconnectDB();
};

run().catch(async (error) => {
  console.error('Backfill failed:', error);
  try {
    await disconnectDB();
  } catch {
    // already down
  }
  process.exit(1);
});
