const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting to MONGO_URI for seeding:', MONGO_URI);

async function run() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB!');

    const db = mongoose.connection.db;

    // 1. Seed or find School
    let school = await db.collection('schools').findOne({ schoolRefNo: 'SCH-DPS-INDORE' });
    if (!school) {
      console.log('School SCH-DPS-INDORE not found. Seeding it...');
      const schoolResult = await db.collection('schools').insertOne({
        name: 'Delhi Public School',
        code: 'DPS-1024',
        schoolRefNo: 'SCH-DPS-INDORE',
        partnerStatus: 'active',
        softDelete: { isDeleted: false },
        audit: { createdAt: new Date(), updatedAt: new Date() }
      });
      school = await db.collection('schools').findOne({ _id: schoolResult.insertedId });
    }
    console.log('School:', school.name, 'ID:', school._id);

    // 2. Find Parent User
    let parentUser = await db.collection('users').findOne({ phone: '9826451236', role: 'parent' });
    if (!parentUser) {
      console.log('Parent user with phone 9826451236 not found. Seeding...');
      const userResult = await db.collection('users').insertOne({
        refId: 'SEM-P-DCLMCL',
        role: 'parent',
        status: 'active',
        name: 'Priyanshi Dass Parent',
        phone: '9826451236',
        phoneVerifiedAt: new Date(),
        audit: { createdAt: new Date(), updatedAt: new Date() }
      });
      parentUser = await db.collection('users').findOne({ _id: userResult.insertedId });
    }
    console.log('Parent User ID:', parentUser._id);

    // 3. Find or Create ParentProfile
    let parentProfile = await db.collection('parentProfiles').findOne({ userId: parentUser._id });
    if (!parentProfile) {
      console.log('Parent profile not found. Seeding...');
      const profileResult = await db.collection('parentProfiles').insertOne({
        userId: parentUser._id,
        referralCode: 'EMART1111',
        softDelete: { isDeleted: false },
        audit: { createdAt: new Date(), updatedAt: new Date() }
      });
      parentProfile = await db.collection('parentProfiles').findOne({ _id: profileResult.insertedId });
    }
    console.log('Parent Profile ID:', parentProfile._id);

    // 4. Find or Create Student "Priyanshi Dass"
    let priyanshiStudent = await db.collection('students').findOne({ schoolId: school._id, name: 'Priyanshi Dass' });
    if (!priyanshiStudent) {
      console.log('Student Priyanshi Dass not found. Seeding...');
      const studentResult = await db.collection('students').insertOne({
        schoolId: school._id,
        name: 'Priyanshi Dass',
        schoolRefNo: 'STU-DPS-010',
        admissionNo: 'ADM-DPS-010',
        rollNo: '10',
        classGrade: 'Class 5',
        section: 'Section A',
        status: 'active',
        parentProfileIds: [parentProfile._id],
        softDelete: { isDeleted: false },
        audit: { createdAt: new Date(), updatedAt: new Date() }
      });
      priyanshiStudent = await db.collection('students').findOne({ _id: studentResult.insertedId });
    } else {
      await db.collection('students').updateOne(
        { _id: priyanshiStudent._id },
        { $set: { parentProfileIds: [parentProfile._id], rollNo: '10', classGrade: 'Class 5', section: 'Section A', admissionNo: 'ADM-DPS-010', 'softDelete.isDeleted': false, status: 'active' } }
      );
    }
    console.log('Priyanshi Student ID:', priyanshiStudent._id);

    // 5. Update Parent's ChildProfile
    let childProfile = await db.collection('childProfiles').findOne({ parentUserId: parentUser._id });
    if (!childProfile) {
      console.log('Child profile not found. Seeding child profile...');
      const childResult = await db.collection('childProfiles').insertOne({
        parentUserId: parentUser._id,
        name: 'Priyanshi Dass',
        schoolId: school._id,
        schoolRefNo: 'SCH-DPS-INDORE',
        grade: 'Class 5',
        rollNo: '10',
        studentId: priyanshiStudent._id,
        softDelete: { isDeleted: false },
        audit: { createdAt: new Date(), updatedAt: new Date() }
      });
      childProfile = await db.collection('childProfiles').findOne({ _id: childResult.insertedId });
    } else {
      await db.collection('childProfiles').updateOne(
        { _id: childProfile._id },
        { $set: { studentId: priyanshiStudent._id, rollNo: '10', schoolId: school._id, schoolRefNo: 'SCH-DPS-INDORE', grade: 'Class 5', 'softDelete.isDeleted': false } }
      );
    }
    console.log('Child Profile linked successfully.');

    // 6. Update ParentProfile activeChildId
    await db.collection('parentProfiles').updateOne(
      { _id: parentProfile._id },
      { $set: { activeChildId: childProfile._id } }
    );

    // 7. Seed 9 other students in Delhi Public School for Class 5, Section A
    const otherStudents = [
      { name: 'Aarav Sharma', roll: '1', ref: 'STU-DPS-001' },
      { name: 'Ananya Verma', roll: '2', ref: 'STU-DPS-002' },
      { name: 'Rohan Singh', roll: '3', ref: 'STU-DPS-003' },
      { name: 'Diya Patel', roll: '4', ref: 'STU-DPS-004' },
      { name: 'Vivaan Gupta', roll: '5', ref: 'STU-DPS-005' },
      { name: 'Meera Joshi', roll: '6', rollNo: '6', ref: 'STU-DPS-006' },
      { name: 'Kabir Malhotra', roll: '7', ref: 'STU-DPS-007' },
      { name: 'Isha Reddy', roll: '8', ref: 'STU-DPS-008' },
      { name: 'Devansh Roy', roll: '9', ref: 'STU-DPS-009' }
    ];

    for (const stud of otherStudents) {
      let existingStud = await db.collection('students').findOne({ schoolId: school._id, name: stud.name });
      if (!existingStud) {
        console.log(`Seeding student: ${stud.name}...`);
        await db.collection('students').insertOne({
          schoolId: school._id,
          name: stud.name,
          schoolRefNo: stud.ref,
          admissionNo: 'ADM-DPS-' + stud.ref.slice(-3),
          rollNo: stud.roll,
          classGrade: 'Class 5',
          section: 'Section A',
          status: 'active',
          parentProfileIds: [],
          softDelete: { isDeleted: false },
          audit: { createdAt: new Date(), updatedAt: new Date() }
        });
      } else {
        await db.collection('students').updateOne(
          { _id: existingStud._id },
          { $set: { rollNo: stud.roll, classGrade: 'Class 5', section: 'Section A', admissionNo: 'ADM-DPS-' + stud.ref.slice(-3), 'softDelete.isDeleted': false, status: 'active' } }
        );
      }
    }
    console.log('Class 5 Section A roster seeded successfully.');

    // 8. Seed approved teacher user: teacher@school.com / password123
    let teacherUser = await db.collection('users').findOne({ email: 'teacher@school.com' });
    const teacherPasswordHash = await bcrypt.hash('password123', 10);
    if (!teacherUser) {
      console.log('Seeding teacher user...');
      const userResult = await db.collection('users').insertOne({
        refId: 'SEM-TCH-123456',
        role: 'teacher',
        status: 'active',
        name: 'Priya Damodaran',
        email: 'teacher@school.com',
        phone: '9876543210',
        passwordHash: teacherPasswordHash,
        passwordAlgo: 'bcrypt',
        tenantSchoolId: school._id,
        phoneVerifiedAt: new Date(),
        audit: { createdAt: new Date(), updatedAt: new Date() }
      });
      teacherUser = await db.collection('users').findOne({ _id: userResult.insertedId });
    } else {
      await db.collection('users').updateOne(
        { _id: teacherUser._id },
        { $set: { passwordHash: teacherPasswordHash, status: 'active', tenantSchoolId: school._id } }
      );
    }
    console.log('Teacher User ID:', teacherUser._id);

    // 9. Seed approved TeacherProfile
    let teacherProfile = await db.collection('teacherProfiles').findOne({ userId: teacherUser._id });
    if (!teacherProfile) {
      console.log('Seeding teacher profile...');
      await db.collection('teacherProfiles').insertOne({
        userId: teacherUser._id,
        schoolId: school._id,
        employeeId: 'EMP-DPS-001',
        designation: 'Class Teacher',
        department: 'Primary School',
        classAssignments: [
          { class: 'Class 5', section: 'Section A' },
          { class: 'Class 5', section: 'Section B' },
          { class: 'Class 6', section: 'Section A' },
          { class: 'Class 6', section: 'Section B' }
        ],
        approvalStatus: 'approved',
        approvedAt: new Date(),
        softDelete: { isDeleted: false },
        audit: { createdAt: new Date(), updatedAt: new Date() }
      });
    } else {
      await db.collection('teacherProfiles').updateOne(
        { _id: teacherProfile._id },
        {
          $set: {
            schoolId: school._id,
            classAssignments: [
              { class: 'Class 5', section: 'Section A' },
              { class: 'Class 5', section: 'Section B' },
              { class: 'Class 6', section: 'Section A' },
              { class: 'Class 6', section: 'Section B' }
            ],
            approvalStatus: 'approved',
            approvedAt: new Date()
          }
        }
      );
    }
    console.log('Teacher Profile setup completed successfully.');

    // 10. Seed Membership
    let membership = await db.collection('memberships').findOne({ userId: teacherUser._id, schoolId: school._id });
    if (!membership) {
      await db.collection('memberships').insertOne({
        userId: teacherUser._id,
        schoolId: school._id,
        role: 'teacher',
        status: 'approved',
        audit: { createdAt: new Date(), updatedAt: new Date() }
      });
    }

  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

run();
