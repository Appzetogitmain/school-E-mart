const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const headerCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  imageUrl: { type: String },
  commissionPercent: { type: mongoose.Schema.Types.Decimal128, required: true, default: 0, min: 0, max: 100 },
  feesFlatPaise: { type: Number, required: true, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  },
  displayOrder: { type: Number, required: true, default: 0 }
}, { collection: 'headerCategories' });

// Plugins
headerCategorySchema.plugin(auditPlugin);
headerCategorySchema.plugin(softDeletePlugin);

// Indexes
// slug is unique
headerCategorySchema.index({ status: 1, displayOrder: 1 });
// Soft delete compound index
headerCategorySchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('HeaderCategory', headerCategorySchema);
