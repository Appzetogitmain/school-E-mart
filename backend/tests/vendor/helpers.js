const mongoose = require('mongoose');
const User = require('../../src/database/models/User');
const VendorProfile = require('../../src/database/models/VendorProfile');
const Order = require('../../src/database/models/Order');
const ReturnRequest = require('../../src/database/models/ReturnRequest');
const Product = require('../../src/database/models/Product');
const { hashPassword } = require('../../src/utils');
const { generateUserRefId } = require('../../src/modules/school/utils/refId');
const tokenService = require('../../src/modules/auth/services/token.service');
const { ROLE_DEFAULT_PERMISSIONS } = require('../../src/constants/permissions');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const productService = require('../../src/modules/marketplace/services/product.service');

const createVendorUser = async ({
  approvalStatus = 'approved',
  userStatus = 'active',
  storeName = 'Test Store',
} = {}) => {
  const { hash, algo } = await hashPassword('Vendor@123');
  const user = await User.create({
    refId: generateUserRefId('VEN'),
    role: 'vendor',
    status: userStatus,
    name: 'Test Vendor',
    email: `vendor${Date.now()}@test.com`,
    phone: `9${String(Date.now()).slice(-9)}`,
    passwordHash: hash,
    passwordAlgo: algo,
  });

  const profile = await VendorProfile.create({
    userId: user._id,
    storeName,
    storeSlug: `store-${Date.now()}`,
    commissionPercent: 10,
    approvalStatus,
    address: {
      line1: '123 Test St',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      pinCode: '110001',
    },
    location: { type: 'Point', coordinates: [77.2, 28.6] },
    serviceRadiusKm: 15,
  });

  return { user, profile };
};

const createAdminUser = async () => {
  const { hash, algo } = await hashPassword('Admin@123');
  const user = await User.create({
    refId: generateUserRefId('SADM'),
    role: 'admin',
    status: 'active',
    name: 'Admin User',
    email: `admin${Date.now()}@test.com`,
    phone: `8${String(Date.now()).slice(-9)}`,
    passwordHash: hash,
    passwordAlgo: algo,
  });
  return user;
};

const authHeaderFor = async (user, role = user.role) => {
  const permissions = ROLE_DEFAULT_PERMISSIONS[role] || [];
  const scopes = role === 'admin' ? ['*'] : [];
  const tokens = await tokenService.createSessionTokens(user, { permissions, scopes });
  return `Bearer ${tokens.accessToken}`;
};

const seedProduct = async (vendorId) => {
  const header = await taxonomyService.createHeaderCategory({ name: `Header-${Date.now()}` });
  const category = await taxonomyService.createCategory({ headerId: header._id, name: 'Category A' });
  return productService.createProduct(vendorId, {
    name: 'Test Product',
    sku: `SKU-${Date.now()}`,
    headerId: header._id,
    categoryId: category._id,
    pricePaise: 10000,
    images: [{ attachmentId: new mongoose.Types.ObjectId() }],
    approvalStatus: 'approved',
    publishStatus: 'published',
    stock: 20,
    lowStockThreshold: 5,
  });
};

const seedOrder = async (vendorId, userId, product) => {
  return Order.create({
    orderNumber: `ORD${Date.now()}`,
    userId,
    audience: 'parent',
    items: [
      {
        productId: product._id,
        vendorId,
        name: product.name,
        sku: product.sku,
        pricePaise: product.pricePaise,
        mrpPaise: product.pricePaise,
        quantity: 2,
        taxPaise: 0,
        lineTotalPaise: product.pricePaise * 2,
      },
    ],
    vendorIds: [vendorId],
    subtotalPaise: product.pricePaise * 2,
    taxPaise: 0,
    discountPaise: 0,
    platformFeePaise: 0,
    deliveryChargePaise: 0,
    handlingChargePaise: 0,
    totalPaise: product.pricePaise * 2,
    address: { line1: 'Test' },
    deliveryType: 'home',
    paymentMethod: 'cod',
    paymentStatus: 'paid',
    orderStatus: 'placed',
    statusHistory: [{ status: 'placed', at: new Date() }],
    placedAt: new Date(),
  });
};

const seedReturn = async (vendorId, userId, order, product) => {
  return ReturnRequest.create({
    orderId: order._id,
    orderItemIndex: 0,
    userId,
    vendorId,
    productSnapshot: {
      name: product.name,
      sku: product.sku,
      pricePaise: product.pricePaise,
      quantity: 1,
    },
    reason: 'Defective',
    status: 'requested',
    timeline: [{ status: 'requested', at: new Date() }],
  });
};

module.exports = {
  createVendorUser,
  createAdminUser,
  authHeaderFor,
  seedProduct,
  seedOrder,
  seedReturn,
};
