const mongoose = require('mongoose');
const User = require('../../src/database/models/User');
const SchoolStaffProfile = require('../../src/database/models/SchoolStaffProfile');
const { hashPassword } = require('../../src/utils');
const { generateUserRefId } = require('../../src/modules/school/utils/refId');
const tokenService = require('../../src/modules/auth/services/token.service');
const { ROLE_DEFAULT_PERMISSIONS } = require('../../src/constants/permissions');
const cartService = require('../../src/modules/marketplace/services/cart.service');
const schoolService = require('../../src/modules/school/services/school.service');
const { createVendorUser, seedProduct } = require('../vendor/helpers');

const createParentUser = async () => {
  const { hash, algo } = await hashPassword('Parent@123');
  const user = await User.create({
    refId: generateUserRefId('P'),
    role: 'parent',
    status: 'active',
    name: 'Parent User',
    email: `parent${Date.now()}@test.com`,
    phone: `9${String(Date.now()).slice(-9)}`,
    passwordHash: hash,
    passwordAlgo: algo,
  });
  return user;
};

const createSchoolUser = async () => {
  const school = await schoolService.createSchool({
    name: `Test School ${Date.now()}`,
    schoolRefNo: `SCH-${Date.now()}`,
  });
  const { hash, algo } = await hashPassword('School@123');
  const user = await User.create({
    refId: generateUserRefId('ADM'),
    role: 'school',
    status: 'active',
    name: 'School Admin',
    email: `school${Date.now()}@test.com`,
    phone: `8${String(Date.now()).slice(-9)}`,
    passwordHash: hash,
    passwordAlgo: algo,
    tenantSchoolId: school._id,
  });
  await SchoolStaffProfile.create({
    userId: user._id,
    schoolId: school._id,
    designation: 'Admin',
  });
  return { user, school };
};

const authHeaderFor = async (user, role = user.role) => {
  const permissions = ROLE_DEFAULT_PERMISSIONS[role] || [];
  const scopes = role === 'admin' ? ['*'] : [];
  const tokens = await tokenService.createSessionTokens(user, { permissions, scopes });
  return `Bearer ${tokens.accessToken}`;
};

const seedCartForUser = async (userId, audience = 'parent') => {
  const { profile } = await createVendorUser();
  const product = await seedProduct(profile._id);
  await cartService.addItem(userId, audience, { productId: product._id, quantity: 1 });
  return { product, vendorId: profile._id };
};

const defaultAddress = {
  line1: '123 Main Street',
  city: 'Delhi',
  state: 'Delhi',
  country: 'India',
  pinCode: '110001',
};

module.exports = {
  createParentUser,
  createSchoolUser,
  authHeaderFor,
  seedCartForUser,
  defaultAddress,
  createVendorUser,
  seedProduct,
};
