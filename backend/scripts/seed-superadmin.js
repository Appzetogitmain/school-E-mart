/**
 * Idempotent dev seed for the default super admin account.
 * Usage: node scripts/seed-superadmin.js
 */
const dns = require('dns');

// Match server bootstrap — Atlas SRV lookups fail on some local DNS resolvers.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/database/connection');
const User = require('../src/database/models/User');
const AdminProfile = require('../src/database/models/AdminProfile');
const { hashPassword, normalizeEmail } = require('../src/utils');
const { ROLES } = require('../src/constants/roles');

const SUPER_ADMIN = {
  email: 'superadmin@schoolemart.com',
  password: '123456',
  name: 'Super Admin',
  phone: '9000000001',
  refId: 'SEM-SADM-SUPADM',
};

async function seedSuperAdmin() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    throw new Error('MongoDB URI is not configured. Set MONGODB_URI or MONGO_URI in backend/.env');
  }

  await connectDB(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const email = normalizeEmail(SUPER_ADMIN.email);
  const existing = await User.findOne({ email, role: ROLES.SUPER_ADMIN });

  if (existing) {
    await AdminProfile.updateOne(
      { userId: existing._id },
      {
        $setOnInsert: {
          firstName: 'Super',
          lastName: 'Admin',
          mobile: SUPER_ADMIN.phone,
          scopes: ['*'],
        },
      },
      { upsert: true }
    );

    console.log('Super admin already exists:', {
      id: existing._id.toString(),
      email: existing.email,
      refId: existing.refId,
    });
    return existing;
  }

  const { hash, algo } = await hashPassword(SUPER_ADMIN.password);

  const user = await User.create({
    refId: SUPER_ADMIN.refId,
    role: ROLES.SUPER_ADMIN,
    status: 'active',
    name: SUPER_ADMIN.name,
    email,
    phone: SUPER_ADMIN.phone,
    passwordHash: hash,
    passwordAlgo: algo,
    emailVerifiedAt: new Date(),
    phoneVerifiedAt: new Date(),
  });

  await AdminProfile.updateOne(
    { userId: user._id },
    {
      $setOnInsert: {
        firstName: 'Super',
        lastName: 'Admin',
        mobile: SUPER_ADMIN.phone,
        scopes: ['*'],
      },
    },
    { upsert: true }
  );

  console.log('Super admin seeded successfully:', {
    id: user._id.toString(),
    email: user.email,
    refId: user.refId,
    password: SUPER_ADMIN.password,
  });

  return user;
}

seedSuperAdmin()
  .catch((error) => {
    console.error('Failed to seed super admin:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
