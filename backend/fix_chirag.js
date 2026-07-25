const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function fix() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_e_mart';
  console.log('Connecting to Mongo:', uri);
  await mongoose.connect(uri);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const VendorProfile = mongoose.model('VendorProfile', new mongoose.Schema({}, { strict: false }), 'vendorprofiles');
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');

  // 1. Find all vendor users
  const vendorUsers = await User.find({ role: 'vendor' }).lean();
  console.log(`Found ${vendorUsers.length} vendor users.`);

  for (const user of vendorUsers) {
    let profile = await VendorProfile.findOne({ userId: user._id });
    if (!profile) {
      console.log(`Creating missing VendorProfile for ${user.name} (${user.email || user._id})...`);
      const storeSlug = (user.name || 'vendor').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + user._id.toString().slice(-4);
      profile = await VendorProfile.create({
        userId: user._id,
        storeName: user.name || 'Vendor Store',
        storeSlug,
        commissionPercent: 10,
        approvalStatus: 'approved',
        serviceRadiusKm: 10,
        categories: [],
      });
      console.log(`Created VendorProfile ID: ${profile._id}`);
    } else {
      if (profile.approvalStatus !== 'approved') {
        await VendorProfile.updateOne({ _id: profile._id }, { $set: { approvalStatus: 'approved' } });
        console.log(`Updated VendorProfile ${profile._id} to approved.`);
      }
    }

    // Link any orphaned products created by this user's ID to their VendorProfile._id
    const updatedProducts = await Product.updateMany(
      { $or: [{ vendorId: user._id }, { vendorId: new mongoose.Types.ObjectId(user._id.toString().slice(0, 23) + 'a') }] },
      { $set: { vendorId: profile._id, approvalStatus: 'approved', publishStatus: 'published' } }
    );
    console.log(`Updated products for ${user.name}:`, updatedProducts);
  }

  // Also approve all pending products so they immediately show up
  const allPendingProducts = await Product.updateMany(
    { approvalStatus: 'pending' },
    { $set: { approvalStatus: 'approved', publishStatus: 'published' } }
  );
  console.log('Approved all pending products:', allPendingProducts);

  await mongoose.disconnect();
  console.log('Fix complete!');
}

fix().catch(console.error);
