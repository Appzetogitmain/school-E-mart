const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const productSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', required: true },
  name: { type: String, required: true, maxlength: 160 },
  slug: { type: String, required: true, unique: true },
  sku: { type: String, required: true }, // unique per vendor conceptually, but global unique for ease of querying
  brand: { type: String },
  description: { type: String, maxlength: 5000 },
  headerId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeaderCategory', required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  subcategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
  // Who this product is sold to. 'users' = retail (shown in the User app),
  // 'schools' = bulk (shown in the School module). A vendor may list both kinds.
  audience: {
    type: String,
    enum: ['users', 'schools'],
    required: true,
    default: 'users'
  },
  gradeTags: [{ type: String }],
  pricePaise: { type: Number, required: true, min: 0 },
  originalPricePaise: { type: Number, min: 0 },
  taxRatePercent: { type: mongoose.Schema.Types.Decimal128, required: true, default: 0, min: 0, max: 28 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  lowStockThreshold: { type: Number, required: true, default: 5, min: 0 },
  images: [{
    attachmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment', required: true },
    alt: { type: String }
  }],
  sizes: [{ type: String }],
  specs: [{
    key: { type: String },
    value: { type: String }
  }],
  variants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' }],
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    required: true,
    default: 'pending'
  },
  publishStatus: {
    type: String,
    enum: ['draft', 'published'],
    required: true,
    default: 'draft'
  },
  ratingAvg: { type: mongoose.Schema.Types.Decimal128, min: 0, max: 5 },
  ratingCount: { type: Number, default: 0, min: 0 },
  salesCount: { type: Number, required: true, default: 0, min: 0 }
}, { collection: 'products' });

// Plugins
productSchema.plugin(auditPlugin);
productSchema.plugin(softDeletePlugin);

// Indexes
productSchema.index({ sku: 1 }, { unique: true });
productSchema.index({ vendorId: 1, 'audit.createdAt': -1 });
productSchema.index({ headerId: 1, categoryId: 1, subcategoryId: 1, approvalStatus: 1, publishStatus: 1 });
productSchema.index({ gradeTags: 1, publishStatus: 1, salesCount: -1 });
// Storefront listings filter by audience (User app vs School module)
productSchema.index({ audience: 1, publishStatus: 1, approvalStatus: 1 });
productSchema.index({ approvalStatus: 1, 'audit.createdAt': -1 });

// Partial index for low stock
productSchema.index(
  { stock: 1 },
  { partialFilterExpression: { stock: { $lte: 5 } } }
);

productSchema.index({ salesCount: -1 });
productSchema.index({ name: 'text', brand: 'text', sku: 'text', description: 'text' });

// Soft delete compound index
productSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Product', productSchema);
