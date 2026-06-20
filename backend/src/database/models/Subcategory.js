const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const subcategorySchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  imageUrl: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  },
  displayOrder: { type: Number, required: true, default: 0 }
}, { collection: 'subcategories' });

// Plugins
subcategorySchema.plugin(auditPlugin);
subcategorySchema.plugin(softDeletePlugin);

// Indexes
// slug is unique
subcategorySchema.index({ categoryId: 1, displayOrder: 1 });
subcategorySchema.index({ status: 1, displayOrder: 1 });
// Soft delete compound index
subcategorySchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Subcategory', subcategorySchema);
