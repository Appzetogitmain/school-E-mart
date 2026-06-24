const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;

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

    // 4. Get students count and query for Class 5, Section A
    const students = await db.collection('students').find({}).toArray();
    console.log(`\n--- STUDENTS (${students.length} total) ---`);
    students.forEach(s => {
      console.log(`Student: ${s.name}, Class: ${s.classGrade}, Section: ${s.section}, Roll: ${s.rollNo}, School: ${s.schoolId}, isDeleted: ${s.softDelete?.isDeleted}, status: ${s.status}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.error);
