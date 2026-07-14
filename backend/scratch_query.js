const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');
  try {
    const db = mongoose.connection.db;

    // 1. Get schools
    const schools = await db.collection('schools').find({}).toArray();
    console.log('--- SCHOOLS ---');
    schools.forEach(s => console.log(`School: ${s.name}, ID: ${s._id}, schoolRefNo: ${s.schoolRefNo}, isDeleted: ${s.softDelete?.isDeleted}`));

    // 2. Get teachers
    const teachers = await db.collection('users').find({ role: 'teacher' }).toArray();
    console.log('\n--- TEACHERS ---');
    teachers.forEach(t => console.log(`Teacher: ${t.name}, Email: ${t.email}, tenantSchoolId: ${t.tenantSchoolId}, isDeleted: ${t.softDelete?.isDeleted}`));

    // 3. Get teacher profiles
    const teacherProfiles = await db.collection('teacherProfiles').find({}).toArray();
    console.log('\n--- TEACHER PROFILES ---');
    teacherProfiles.forEach(tp => console.log(`TP User: ${tp.userId}, School: ${tp.schoolId}, Assignments: ${JSON.stringify(tp.classAssignments)}, approvalStatus: ${tp.approvalStatus}`));

    // 5. Get parents count and details
    const parents = await db.collection('users').find({ role: 'parent' }).toArray();
    console.log(`\n--- PARENTS (${parents.length} total) ---`);
    parents.forEach(p => console.log(`Parent: ${p.name}, Email: ${p.email}, Phone: ${p.phone}, tenantSchoolId: ${p.tenantSchoolId}, refId: ${p.refId}`));

    // 6. Get parentProfiles
    const parentProfiles = await db.collection('parentProfiles').find({}).toArray();
    console.log(`\n--- PARENT PROFILES (${parentProfiles.length} total) ---`);
    parentProfiles.forEach(pp => console.log(`Profile ID: ${pp._id}, User ID: ${pp.userId}, referralCode: ${pp.referralCode}, activeChildId: ${pp.activeChildId}`));

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.error);
