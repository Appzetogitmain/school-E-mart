const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const kitSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }, // null = platform-curated
  // The single vendor the school selects to supply and fulfil this kit. Every
  // order for the kit is routed to this vendor regardless of who owns the
  // individual products; the school earns commission, the vendor is paid to
  // fulfil, the platform keeps its cut.
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  classGrade: { type: String },
  category: { type: String },
  description: { type: String },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 },
    optional: { type: Boolean, default: false }
  }],
  addOns: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    qty: { type: Number, required: true, min: 1 }
  }],
  pricePaise: { type: Number, required: true, min: 0 },
  mrpPaise: { type: Number, required: true, min: 0 },
  sku: { type: String, required: true, unique: true },
  status: {
    type: String,
    enum: ['active', 'draft'],
    required: true,
    default: 'draft'
  },
  flags: {
    showOnApp: { type: Boolean, required: true, default: false },
    availableOnline: { type: Boolean, required: true, default: false },
    allowPreorders: { type: Boolean, required: true, default: false }
  }
}, { collection: 'kits' });

// Plugins
kitSchema.plugin(auditPlugin);
kitSchema.plugin(softDeletePlugin);

// Indexes
kitSchema.index({ schoolId: 1, status: 1 });
kitSchema.index({ name: 'text' });
// Soft delete compound index
kitSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Kit', kitSchema);
