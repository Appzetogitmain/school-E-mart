const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function check() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_e_mart';
  await mongoose.connect(uri);

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const VendorProfile = mongoose.model('VendorProfile', new mongoose.Schema({}, { strict: false }), 'vendorprofiles');
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');

  const allVP = await VendorProfile.find({}).lean();
  console.log('--- ALL VENDOR PROFILES ---');
  for (const vp of allVP) {
    const u = await User.findById(vp.userId).lean();
    const prods = await Product.find({ vendorId: vp._id }).lean();
    console.log(`VendorProfile ID: ${vp._id} | storeName: "${vp.storeName}" | approval: ${vp.approvalStatus}`);
    console.log(`  Linked User: ${u?.name} (${u?.email}, role: ${u?.role}) | UserID: ${vp.userId}`);
    console.log(`  Products Count: ${prods.length}`);
    prods.forEach(p => console.log(`    - Product: "${p.name}" (ID: ${p._id})`));
  }

  await mongoose.disconnect();
}

check().catch(console.error);
