/**
 * Idempotent dev seed for default support topics.
 * Usage: node scripts/seed-support-topics.js
 */
const dns = require('dns');

// Match server bootstrap — Atlas SRV lookups fail on some local DNS resolvers.
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const env = require('../src/config/env');
const { connectDB, disconnectDB } = require('../src/database/connection');
const SupportTopic = require('../src/database/models/SupportTopic');

const TOPICS = [
  { name: 'Order & Delivery', slug: 'order-delivery', audience: 'parent', displayOrder: 1 },
  { name: 'Payments & Refunds', slug: 'payments-refunds', audience: 'parent', displayOrder: 2 },
  { name: 'Product Enquiry', slug: 'product-enquiry', audience: 'parent', displayOrder: 3 },
  { name: 'School / Institutional', slug: 'school-institutional', audience: 'school', displayOrder: 4 },
  { name: 'Vendor / Seller Support', slug: 'vendor-support', audience: 'vendor', displayOrder: 5 },
  { name: 'Account & Login', slug: 'account-login', audience: 'general', displayOrder: 6 },
  { name: 'Other', slug: 'other', audience: 'general', displayOrder: 7 },
];

async function seedSupportTopics() {
  if (!env.MONGODB_URI) {
    throw new Error('MongoDB URI is not configured. Set MONGODB_URI in backend/.env');
  }

  await connectDB(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  for (const topic of TOPICS) {
    await SupportTopic.updateOne(
      { slug: topic.slug },
      { $set: { status: 'active', ...topic } },
      { upsert: true }
    );
  }

  const count = await SupportTopic.countDocuments({ status: 'active' });
  console.log(`Support topics seeded. Active topics: ${count}`);
}

seedSupportTopics()
  .catch((error) => {
    console.error('Failed to seed support topics:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDB().catch(() => {});
  });
