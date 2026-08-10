const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const kitSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  // Assigned vendor for fulfillment
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  classGrade: { type: String },
  category: { type: String },
  description: { type: String },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
  imageUrl: { type: String },
  items: [{
    masterProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'MasterKitProduct' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    category: { type: String },
    subcategory: { type: String },
    imageUrl: { type: String },
    qty: { type: Number, required: true, min: 1, default: 1 },
    attributes: {
      color: { type: String },
      sizes: [{ type: String }],
      gender: { type: String },
      publisher: { type: String },
      subject: { type: String },
      packDetails: { type: String }
    }
  }],
  pricePaise: { type: Number, required: true, min: 0 },
  mrpPaise: { type: Number, required: true, min: 0 },
  sku: { type: String },
  status: {
    type: String,
    enum: ['active', 'draft'],
    required: true,
    default: 'active'
  },
  flags: {
    showOnApp: { type: Boolean, default: true },
    availableOnline: { type: Boolean, default: true },
    allowPreorders: { type: Boolean, default: false }
  }
}, { collection: 'kits' });

// Plugins
kitSchema.plugin(auditPlugin);
kitSchema.plugin(softDeletePlugin);

// Indexes
kitSchema.index({ schoolId: 1, status: 1 });
kitSchema.index({ vendorId: 1 });
kitSchema.index({ name: 'text' });
kitSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

const KitModel = mongoose.model('Kit', kitSchema);

// A kit is only safe to add to a cart or turn into an order line item when the
// school has actually published it, it hasn't been removed, and a vendor is
// assigned to fulfil it. `Kit.findById()` on its own does not check any of that —
// it would happily return a draft, a soft-deleted kit, or one with no vendor.
// Any lookup that feeds a purchase (as opposed to school/admin management, which
// legitimately needs to see drafts) must go through this filter.
KitModel.purchasableFilter = (id) => ({
  _id: id,
  status: 'active',
  vendorId: { $ne: null },
  'softDelete.isDeleted': { $ne: true },
});

module.exports = KitModel;
