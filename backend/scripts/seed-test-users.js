/**
 * Idempotent dev seed: 2 users per role (school, teacher, parent, vendor)
 * with linked schools, children, and students for end-to-end testing.
 *
 * Usage: node scripts/seed-test-users.js
 *        npm run seed:test-users
 */
const dns = require('dns');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/database/connection');
const { hashPassword, normalizeEmail } = require('../src/utils');
const User = require('../src/database/models/User');
const School = require('../src/database/models/School');
const SchoolStaffProfile = require('../src/database/models/SchoolStaffProfile');
const TeacherProfile = require('../src/database/models/TeacherProfile');
const SchoolMembership = require('../src/database/models/SchoolMembership');
const ParentProfile = require('../src/database/models/ParentProfile');
const ChildProfile = require('../src/database/models/ChildProfile');
const Student = require('../src/database/models/Student');
const VendorProfile = require('../src/database/models/VendorProfile');

const PASSWORD = '123456';

const SEED_SCHOOLS = [
  {
    school: {
      schoolRefNo: 'SCH-SEED-DPS',
      code: 'DPS-SEED',
      name: 'Delhi Public School (Seed)',
      partnerStatus: 'active',
    },
    schoolAdmin: {
      refId: 'SEM-ADM-DPS01',
      email: 'school1@seed.test',
      phone: '9100000001',
      name: 'DPS School Admin',
    },
    teacher: {
      refId: 'SEM-TCH-DPS01',
      email: 'teacher1@seed.test',
      phone: '9200000001',
      name: 'DPS Teacher One',
    },
    parent: {
      refId: 'SEM-P-DPS001',
      phone: '9300000001',
      name: 'Aarav Parent',
      referralCode: 'EMART1001',
      childName: 'Aarav Sharma',
      grade: 'Class 5',
      section: 'A',
      studentRefNo: 'STU-SEED-DPS-01',
      rollNo: '1',
    },
  },
  {
    school: {
      schoolRefNo: 'SCH-SEED-RYAN',
      code: 'RYA-SEED',
      name: 'Ryan International School (Seed)',
      partnerStatus: 'active',
    },
    schoolAdmin: {
      refId: 'SEM-ADM-RYA01',
      email: 'school2@seed.test',
      phone: '9100000002',
      name: 'Ryan School Admin',
    },
    teacher: {
      refId: 'SEM-TCH-RYA01',
      email: 'teacher2@seed.test',
      phone: '9200000002',
      name: 'Ryan Teacher One',
    },
    parent: {
      refId: 'SEM-P-RYA001',
      phone: '9300000002',
      name: 'Isha Parent',
      referralCode: 'EMART1002',
      childName: 'Isha Patel',
      grade: 'Class 6',
      section: 'B',
      studentRefNo: 'STU-SEED-RYAN-01',
      rollNo: '2',
    },
  },
];

const SEED_VENDORS = [
  {
    refId: 'SEM-VEN-SEED1',
    email: 'vendor1@seed.test',
    phone: '9400000001',
    name: 'Seed Vendor One',
    storeName: 'Seed Store Alpha',
    storeSlug: 'seed-store-alpha',
  },
  {
    refId: 'SEM-VEN-SEED2',
    email: 'vendor2@seed.test',
    phone: '9400000002',
    name: 'Seed Vendor Two',
    storeName: 'Seed Store Beta',
    storeSlug: 'seed-store-beta',
  },
];

const DEFAULT_VENDOR_ADDRESS = {
  line1: '100 Seed Market Road',
  city: 'Delhi',
  state: 'Delhi',
  country: 'India',
  pinCode: '110001',
};

const DEFAULT_VENDOR_LOCATION = { type: 'Point', coordinates: [77.209, 28.6139] };

const logResult = (label, details) => {
  console.log(`  ${label}:`, details);
};

async function findUserByRefId(refId) {
  return User.findOne({ refId, 'softDelete.isDeleted': { $ne: true } });
}

async function ensureSchool(schoolData) {
  let school = await School.findOne({
    schoolRefNo: schoolData.schoolRefNo,
    'softDelete.isDeleted': { $ne: true },
  });

  if (school) {
    await School.updateOne(
      { _id: school._id },
      { $set: { partnerStatus: schoolData.partnerStatus, name: schoolData.name } }
    );
    school = await School.findById(school._id);
    logResult('School (existing)', { schoolRefNo: school.schoolRefNo, id: school._id.toString() });
    return school;
  }

  school = await School.create(schoolData);
  logResult('School (created)', { schoolRefNo: school.schoolRefNo, id: school._id.toString() });
  return school;
}

async function ensurePasswordUser(seedUser, role, extra = {}) {
  const email = normalizeEmail(seedUser.email);
  let user = await findUserByRefId(seedUser.refId);

  if (!user && email) {
    user = await User.findOne({ email, role, 'softDelete.isDeleted': { $ne: true } });
  }
  if (!user) {
    user = await User.findOne({ phone: seedUser.phone, role, 'softDelete.isDeleted': { $ne: true } });
  }

  if (user) {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          status: 'active',
          name: seedUser.name,
          email,
          phone: seedUser.phone,
          ...extra,
        },
      }
    );
    user = await User.findById(user._id);
    logResult(`${role} user (existing)`, { refId: user.refId, email: user.email, phone: user.phone });
    return user;
  }

  const { hash, algo } = await hashPassword(PASSWORD);
  user = await User.create({
    refId: seedUser.refId,
    role,
    status: 'active',
    name: seedUser.name,
    email,
    phone: seedUser.phone,
    passwordHash: hash,
    passwordAlgo: algo,
    emailVerifiedAt: new Date(),
    phoneVerifiedAt: new Date(),
    ...extra,
  });
  logResult(`${role} user (created)`, { refId: user.refId, email: user.email, phone: user.phone });
  return user;
}

async function ensureSchoolAdmin(school, seedAdmin) {
  const user = await ensurePasswordUser(seedAdmin, 'school', { tenantSchoolId: school._id });

  const existingProfile = await SchoolStaffProfile.findOne({
    userId: user._id,
    'softDelete.isDeleted': { $ne: true },
  });

  if (existingProfile) {
    await SchoolStaffProfile.updateOne(
      { _id: existingProfile._id },
      { $set: { schoolId: school._id, designation: 'Admin' } }
    );
    logResult('School staff profile (existing)', { userId: user._id.toString() });
    return user;
  }

  await SchoolStaffProfile.create({
    userId: user._id,
    schoolId: school._id,
    designation: 'Admin',
  });
  logResult('School staff profile (created)', { userId: user._id.toString() });
  return user;
}

async function ensureTeacher(school, seedTeacher) {
  const user = await ensurePasswordUser(seedTeacher, 'teacher', { tenantSchoolId: school._id });

  let profile = await TeacherProfile.findOne({
    userId: user._id,
    'softDelete.isDeleted': { $ne: true },
  });

  if (profile) {
    await TeacherProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          schoolId: school._id,
          approvalStatus: 'approved',
          approvedAt: profile.approvedAt || new Date(),
        },
      }
    );
    logResult('Teacher profile (existing)', { userId: user._id.toString() });
  } else {
    profile = await TeacherProfile.create({
      userId: user._id,
      schoolId: school._id,
      designation: 'Teacher',
      approvalStatus: 'approved',
      approvedAt: new Date(),
    });
    logResult('Teacher profile (created)', { userId: user._id.toString() });
  }

  await SchoolMembership.updateOne(
    { userId: user._id, schoolId: school._id, role: 'teacher' },
    {
      $set: { status: 'approved' },
      $setOnInsert: { userId: user._id, schoolId: school._id, role: 'teacher', joinedAt: new Date() },
    },
    { upsert: true }
  );

  return user;
}

async function ensureParentWithChild(school, seedParent) {
  let user = await findUserByRefId(seedParent.refId);
  if (!user) {
    user = await User.findOne({
      phone: seedParent.phone,
      role: 'parent',
      'softDelete.isDeleted': { $ne: true },
    });
  }

  if (user) {
    await User.updateOne(
      { _id: user._id },
      { $set: { status: 'active', name: seedParent.name, phoneVerifiedAt: new Date() } }
    );
    user = await User.findById(user._id);
    logResult('Parent user (existing)', { refId: user.refId, phone: user.phone });
  } else {
    user = await User.create({
      refId: seedParent.refId,
      role: 'parent',
      status: 'active',
      name: seedParent.name,
      phone: seedParent.phone,
      phoneVerifiedAt: new Date(),
    });
    logResult('Parent user (created)', { refId: user.refId, phone: user.phone });
  }

  let parentProfile = await ParentProfile.findOne({
    userId: user._id,
    'softDelete.isDeleted': { $ne: true },
  });

  if (parentProfile) {
    logResult('Parent profile (existing)', { referralCode: parentProfile.referralCode });
  } else {
    parentProfile = await ParentProfile.create({
      userId: user._id,
      referralCode: seedParent.referralCode,
    });
    logResult('Parent profile (created)', { referralCode: parentProfile.referralCode });
  }

  let student = await Student.findOne({
    schoolId: school._id,
    schoolRefNo: seedParent.studentRefNo,
    'softDelete.isDeleted': { $ne: true },
  });

  if (student) {
    await Student.updateOne(
      { _id: student._id },
      {
        $set: {
          name: seedParent.childName,
          classGrade: seedParent.grade,
          section: seedParent.section,
          rollNo: seedParent.rollNo,
          status: 'active',
        },
        $addToSet: { parentProfileIds: parentProfile._id },
      }
    );
    student = await Student.findById(student._id);
    logResult('Student (existing)', { schoolRefNo: student.schoolRefNo });
  } else {
    student = await Student.create({
      schoolId: school._id,
      name: seedParent.childName,
      schoolRefNo: seedParent.studentRefNo,
      classGrade: seedParent.grade,
      section: seedParent.section,
      rollNo: seedParent.rollNo,
      status: 'active',
      parentProfileIds: [parentProfile._id],
    });
    logResult('Student (created)', { schoolRefNo: student.schoolRefNo });
  }

  let childProfile = await ChildProfile.findOne({
    parentUserId: user._id,
    studentId: student._id,
    'softDelete.isDeleted': { $ne: true },
  });

  if (!childProfile) {
    childProfile = await ChildProfile.findOne({
      parentUserId: user._id,
      name: seedParent.childName,
      'softDelete.isDeleted': { $ne: true },
    });
  }

  if (childProfile) {
    await ChildProfile.updateOne(
      { _id: childProfile._id },
      {
        $set: {
          name: seedParent.childName,
          schoolId: school._id,
          schoolRefNo: school.schoolRefNo,
          grade: seedParent.grade,
          rollNo: seedParent.rollNo,
          studentId: student._id,
        },
      }
    );
    logResult('Child profile (existing)', { name: seedParent.childName });
  } else {
    childProfile = await ChildProfile.create({
      parentUserId: user._id,
      name: seedParent.childName,
      schoolId: school._id,
      schoolRefNo: school.schoolRefNo,
      grade: seedParent.grade,
      rollNo: seedParent.rollNo,
      studentId: student._id,
    });
    logResult('Child profile (created)', { name: seedParent.childName });
  }

  await ParentProfile.updateOne(
    { _id: parentProfile._id },
    { $set: { activeChildId: childProfile._id } }
  );

  return user;
}

async function ensureVendor(seedVendor) {
  const user = await ensurePasswordUser(seedVendor, 'vendor');

  let profile = await VendorProfile.findOne({
    userId: user._id,
    'softDelete.isDeleted': { $ne: true },
  });

  if (profile) {
    await VendorProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          storeName: seedVendor.storeName,
          approvalStatus: 'approved',
          commissionPercent: 10,
        },
      }
    );
    logResult('Vendor profile (existing)', { storeSlug: profile.storeSlug });
    return user;
  }

  const slugTaken = await VendorProfile.findOne({
    storeSlug: seedVendor.storeSlug,
    'softDelete.isDeleted': { $ne: true },
  });
  const storeSlug = slugTaken ? `${seedVendor.storeSlug}-${Date.now()}` : seedVendor.storeSlug;

  profile = await VendorProfile.create({
    userId: user._id,
    storeName: seedVendor.storeName,
    storeSlug,
    commissionPercent: 10,
    approvalStatus: 'approved',
    address: DEFAULT_VENDOR_ADDRESS,
    location: DEFAULT_VENDOR_LOCATION,
    serviceRadiusKm: 15,
  });
  logResult('Vendor profile (created)', { storeSlug: profile.storeSlug });
  return user;
}

async function seedSchoolBundle(bundle) {
  console.log(`\n--- ${bundle.school.name} ---`);
  const school = await ensureSchool(bundle.school);
  await ensureSchoolAdmin(school, bundle.schoolAdmin);
  await ensureTeacher(school, bundle.teacher);
  await ensureParentWithChild(school, bundle.parent);
}

async function seedTestUsers() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error('MongoDB URI is not configured. Set MONGODB_URI or MONGO_URI in backend/.env');
  }

  await connectDB(uri);
  console.log('Connected to MongoDB');
  console.log('Seeding test users (idempotent)...\n');

  for (const bundle of SEED_SCHOOLS) {
    await seedSchoolBundle(bundle);
  }

  console.log('\n--- Vendors ---');
  for (const seedVendor of SEED_VENDORS) {
    await ensureVendor(seedVendor);
  }

  console.log('\n========================================');
  console.log('SEED COMPLETE — Test credentials');
  console.log('========================================');
  console.log(`Password (school / teacher / vendor): ${PASSWORD}`);
  console.log('Parent login: OTP (use DEFAULT_OTP from .env when USE_MOCK_OTP=true)\n');

  console.log('SCHOOL ADMINS:');
  SEED_SCHOOLS.forEach((b) => {
    console.log(`  ${b.schoolAdmin.email} | ${b.schoolAdmin.phone} | schoolRefNo: ${b.school.schoolRefNo}`);
  });

  console.log('\nTEACHERS:');
  SEED_SCHOOLS.forEach((b) => {
    console.log(`  ${b.teacher.email} | ${b.teacher.phone} | schoolRefNo: ${b.school.schoolRefNo}`);
  });

  console.log('\nPARENTS (OTP login):');
  SEED_SCHOOLS.forEach((b) => {
    console.log(`  ${b.parent.phone} | child: ${b.parent.childName} | schoolRefNo: ${b.school.schoolRefNo}`);
  });

  console.log('\nVENDORS:');
  SEED_VENDORS.forEach((v) => {
    console.log(`  ${v.email} | ${v.phone} | store: ${v.storeName}`);
  });
  console.log('========================================\n');
}

seedTestUsers()
  .catch((error) => {
    console.error('Failed to seed test users:', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach((e) => console.error(' -', e.message));
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
