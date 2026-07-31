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

const mongoose = require('mongoose');
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
const Product = require('../src/database/models/Product');
const Order = require('../src/database/models/Order');
const HeaderCategory = require('../src/database/models/HeaderCategory');
const Category = require('../src/database/models/Category');
const productService = require('../src/modules/marketplace/services/product.service');
const taxonomyService = require('../src/modules/marketplace/services/taxonomy.service');
const cartService = require('../src/modules/marketplace/services/cart.service');
const orderService = require('../src/modules/orders/services/order.service');

const PASSWORD = '123456';

const SEED_SCHOOLS = [
  {
    school: {
      schoolRefNo: 'SCH-SEED-DPS',
      code: 'DPS-SEED',
      name: 'Delhi Public School (Seed)',
      partnerStatus: 'active',
      // Non-zero so the seeded retail order actually credits a visible amount
      // to the school's ledger/wallet, not just a 0% snapshot.
      commission: { kitPercent: 5, retailPercent: 10 },
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
    // 10-digit ORD number — real orders use 13-digit timestamps, so no collision.
    demoOrderNumber: 'ORD9000000001',
  },
  {
    refId: 'SEM-VEN-SEED2',
    email: 'vendor2@seed.test',
    phone: '9400000002',
    name: 'Seed Vendor Two',
    storeName: 'Seed Store Beta',
    storeSlug: 'seed-store-beta',
    demoOrderNumber: 'ORD9000000002',
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
    const update = { partnerStatus: schoolData.partnerStatus, name: schoolData.name };
    if (schoolData.commission) update.commission = schoolData.commission;
    await School.updateOne({ _id: school._id }, { $set: update });
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

  // Match on userId regardless of soft-delete state: the unique userId index
  // ignores soft-delete, so a soft-deleted profile still blocks a fresh create.
  // includeDeleted bypasses the plugin's default filter so we can revive it —
  // keeping the seed idempotent instead of throwing a dup-key error.
  let profile = await VendorProfile.findOne({ userId: user._id }).setOptions({ includeDeleted: true });

  if (profile) {
    await VendorProfile.updateOne(
      { _id: profile._id },
      {
        $set: {
          storeName: seedVendor.storeName,
          approvalStatus: 'approved',
          commissionPercent: 10,
          'softDelete.isDeleted': false,
          'softDelete.deletedAt': null,
        },
      },
      { includeDeleted: true }
    );
    profile = await VendorProfile.findById(profile._id).setOptions({ includeDeleted: true });
    logResult('Vendor profile (existing)', { storeSlug: profile.storeSlug });
    return { user, profile };
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
  return { user, profile };
}

// A vendor with no products and no orders makes every screen in the portal look
// broken (empty products, empty orders, zero earnings). Seed a small catalog and
// one incoming order per vendor so the manage/receive-order flow is visible and
// the accept -> deliver -> settlement path can actually be exercised.
const SEED_HEADER_NAME = 'School Essentials (Seed)';
const SEED_CATEGORY_NAME = 'Stationery (Seed)';

// audience: 'users' = retail (User app), 'schools' = bulk (School module). Each
// vendor gets both, so the storefront isolation and vendor-side "Sell To" filter
// both have real, distinct catalogs to exercise.
const SEED_PRODUCTS = [
  { suffix: 'NB', name: 'A4 Ruled Notebook (200 pages)', pricePaise: 12000, stock: 120, audience: 'users' },
  { suffix: 'PEN', name: 'Blue Gel Pen (Pack of 10)', pricePaise: 8500, stock: 80, audience: 'users' },
  { suffix: 'GEO', name: 'Geometry Box Deluxe', pricePaise: 24900, stock: 40, audience: 'users' },
];

const SEED_SCHOOL_PRODUCTS = [
  { suffix: 'SCH-UNI', name: 'Bulk School Uniform Set (Pack of 30)', pricePaise: 450000, stock: 25, audience: 'schools' },
  { suffix: 'SCH-BAG', name: 'Bulk School Bag (Pack of 30)', pricePaise: 600000, stock: 20, audience: 'schools' },
];

async function ensureCatalogTaxonomy() {
  let header = await HeaderCategory.findOne({
    name: SEED_HEADER_NAME,
    'softDelete.isDeleted': { $ne: true },
  });
  if (!header) {
    header = await taxonomyService.createHeaderCategory({ name: SEED_HEADER_NAME });
  }

  let category = await Category.findOne({
    name: SEED_CATEGORY_NAME,
    headerId: header._id,
    'softDelete.isDeleted': { $ne: true },
  });
  if (!category) {
    category = await taxonomyService.createCategory({ headerId: header._id, name: SEED_CATEGORY_NAME });
  }

  return { headerId: header._id, categoryId: category._id };
}

async function ensureVendorProducts(seedVendor, profile, taxonomy) {
  const specs = [...SEED_PRODUCTS, ...SEED_SCHOOL_PRODUCTS];
  const products = [];
  for (const spec of specs) {
    // Deterministic SKU keeps the seed idempotent — createProduct rejects a
    // duplicate SKU, so skip any that already exist for a re-run.
    const sku = `SEED-${seedVendor.refId}-${spec.suffix}`;
    // Include soft-deleted matches: a prior manual test (e.g. exercising the
    // vendor's delete-product action) can leave this SKU soft-deleted, and its
    // slug still occupies the unique index — revive it instead of colliding.
    let product = await Product.findOne({ sku }).setOptions({ includeDeleted: true });
    if (!product) {
      product = await productService.createProduct(profile._id, {
        name: `${spec.name} — ${profile.storeName}`,
        sku,
        headerId: taxonomy.headerId,
        categoryId: taxonomy.categoryId,
        audience: spec.audience,
        pricePaise: spec.pricePaise,
        images: [{ attachmentId: new mongoose.Types.ObjectId() }],
        approvalStatus: 'approved',
        publishStatus: 'published',
        stock: spec.stock,
        lowStockThreshold: 10,
      });
    } else if (product.audience !== spec.audience || product.softDelete?.isDeleted) {
      // Re-tag on rerun in case the seed spec changed, and revive if deleted.
      await Product.updateOne(
        { _id: product._id },
        {
          $set: {
            audience: spec.audience,
            publishStatus: 'published',
            approvalStatus: 'approved',
            stock: spec.stock,
            'softDelete.isDeleted': false,
            'softDelete.deletedAt': null,
            'softDelete.deletedBy': null,
          },
        },
        { includeDeleted: true }
      );
      product = await Product.findById(product._id).setOptions({ includeDeleted: true });
    }
    products.push(product);
  }
  const retailProducts = products.filter((p) => p.audience !== 'schools');
  const schoolProducts = products.filter((p) => p.audience === 'schools');
  logResult('Vendor products', { retail: retailProducts.length, school: schoolProducts.length });
  return { products, retailProducts, schoolProducts };
}

async function ensureVendorOrder(seedVendor, profile, products, customerUserId) {
  if (!customerUserId || !products.length) return;

  const orderNumber = seedVendor.demoOrderNumber;
  const existing = await Order.findOne({ orderNumber, 'softDelete.isDeleted': { $ne: true } });
  if (existing) {
    logResult('Vendor order (existing)', { orderNumber, status: existing.orderStatus });
    return;
  }

  // Two line items from this vendor's catalog, left in the 'placed' state so the
  // vendor sees a fresh incoming order to accept.
  const items = products.slice(0, 2).map((product) => ({
    productId: product._id,
    vendorId: profile._id,
    name: product.name,
    sku: product.sku,
    pricePaise: product.pricePaise,
    mrpPaise: product.pricePaise,
    quantity: 2,
    taxPaise: 0,
    lineTotalPaise: product.pricePaise * 2,
    fulfilmentStatus: 'placed',
  }));
  const subtotalPaise = items.reduce((sum, item) => sum + item.lineTotalPaise, 0);

  await Order.create({
    orderNumber,
    userId: customerUserId,
    audience: 'parent',
    items,
    vendorIds: [profile._id],
    subtotalPaise,
    taxPaise: 0,
    discountPaise: 0,
    platformFeePaise: 0,
    deliveryChargePaise: 0,
    handlingChargePaise: 0,
    totalPaise: subtotalPaise,
    address: {
      name: 'Aarav Parent',
      phone: '9300000001',
      line1: '12 Rajpath Lane',
      city: 'Delhi',
      state: 'Delhi',
      pinCode: '110001',
    },
    deliveryType: 'home',
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    orderStatus: 'placed',
    statusHistory: [{ status: 'placed', at: new Date(), note: 'Order placed (seed)' }],
    placedAt: new Date(),
  });
  logResult('Vendor order (created)', { orderNumber, items: items.length });
}

// Places a real order through the actual cart -> checkout -> commission
// pipeline (not a raw Order.create), so the seed doubles as a live proof that
// audience isolation, delivery charges, and commission crediting all work.
// cartAudience is the buyer channel ('parent' | 'school'); the product's own
// `audience` ('users' | 'schools') must match it or cartService.addItem rejects it.
async function ensureRealOrder({ label, buyerUser, cartAudience, product, address, quantity = 1 }) {
  if (!buyerUser || !product) return;

  const existing = await Order.findOne({
    userId: buyerUser._id,
    audience: cartAudience,
    'items.sku': product.sku,
    'softDelete.isDeleted': { $ne: true },
  }).lean();
  if (existing) {
    logResult(`${label} (existing)`, { orderNumber: existing.orderNumber, status: existing.orderStatus });
    return existing;
  }

  await cartService.addItem(buyerUser._id, cartAudience, { productId: product._id, quantity });
  const order = await orderService.createOrder(
    buyerUser._id,
    cartAudience,
    { address, deliveryType: 'home', paymentMethod: 'cod' },
    { userId: buyerUser._id }
  );
  logResult(`${label} (created)`, { orderNumber: order.orderNumber, total: order.totalPaise });
  return order;
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
  // One customer (a seeded parent) receives the demo orders so the vendor has a
  // real incoming order to accept. Falls back to no order if parents were skipped.
  const demoCustomer = await findUserByRefId('SEM-P-DPS001');
  const dpsSchoolAdmin = await findUserByRefId('SEM-ADM-DPS01');
  const dpsSchool = await School.findOne({ schoolRefNo: 'SCH-SEED-DPS', 'softDelete.isDeleted': { $ne: true } });
  const taxonomy = await ensureCatalogTaxonomy();
  const vendorResults = {};
  for (const seedVendor of SEED_VENDORS) {
    const { profile } = await ensureVendor(seedVendor);
    const result = await ensureVendorProducts(seedVendor, profile, taxonomy);
    await ensureVendorOrder(seedVendor, profile, result.retailProducts, demoCustomer?._id);
    vendorResults[seedVendor.refId] = { profile, ...result };
  }

  // Exercise the real cart -> checkout -> commission pipeline for the primary
  // seed vendor, so the isolation guard and school commission crediting are
  // both provably working, not just structurally present.
  const primaryVendor = vendorResults['SEM-VEN-SEED1'];
  if (primaryVendor && demoCustomer && dpsSchool) {
    console.log('\n--- Real order flow (vendor: SEM-VEN-SEED1) ---');
    const buyerAddress = {
      name: 'Aarav Parent',
      phone: '9300000001',
      line1: '12 Rajpath Lane',
      city: 'Delhi',
      state: 'Delhi',
      pinCode: '110001',
    };

    // Retail purchase by a parent linked to DPS -> DPS should earn its
    // configured retail commission % on this line (see commission.service.js).
    // Index 2 (GEO) deliberately avoids products[0..1], which ensureVendorOrder's
    // raw demo order above already placed for this same parent.
    if (primaryVendor.retailProducts[2]) {
      await ensureRealOrder({
        label: 'Retail order (parent, general marketplace)',
        buyerUser: demoCustomer,
        cartAudience: 'parent',
        product: primaryVendor.retailProducts[2],
        address: buyerAddress,
        quantity: 1,
      });
    }

    // Bulk purchase by the school itself -> school is the buyer, so it earns
    // no commission on its own order (platform-only split); proves the
    // 'schools' audience product is reachable only through the school cart.
    if (primaryVendor.schoolProducts[0] && dpsSchoolAdmin) {
      const schoolAddress = {
        name: 'Delhi Public School (Seed)',
        phone: dpsSchoolAdmin.phone || '9100000001',
        line1: '1 School Campus Road',
        city: 'Delhi',
        state: 'Delhi',
        pinCode: '110001',
      };
      await ensureRealOrder({
        label: 'Bulk order (school, school module)',
        buyerUser: dpsSchoolAdmin,
        cartAudience: 'school',
        product: primaryVendor.schoolProducts[0],
        address: schoolAddress,
        quantity: 2,
      });
    }
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
    console.log(`  ${v.email} | ${v.phone} | store: ${v.storeName} | refId: ${v.refId}`);
  });

  console.log('\nVENDOR CATALOG (per vendor, "Sell To" tagged):');
  console.log(`  Retail (Users): ${SEED_PRODUCTS.map((p) => p.name).join(', ')}`);
  console.log(`  Bulk (Schools): ${SEED_SCHOOL_PRODUCTS.map((p) => p.name).join(', ')}`);
  console.log('  -> Log in as vendor1@seed.test, open Products, use the Users/Schools tabs to see them isolated.');
  console.log('  -> Log in as school1@seed.test, open Bulk Products — only the "Bulk" catalog above is visible.');
  console.log('  -> Log in as parent 9300000001 (OTP), open the store — only the "Retail" catalog above is visible.');
  console.log('  -> A real retail order + a real bulk order were placed via the actual checkout/commission pipeline');
  console.log('     for vendor1 — check Vendor > Orders, and School > Wallet for the credited retail commission.');
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
