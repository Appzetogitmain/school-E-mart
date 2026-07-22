const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const categorySchema = new mongoose.Schema({
  headerId: { type: mongoose.Schema.Types.ObjectId, ref: 'HeaderCategory', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  imageUrl: { type: String },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  },
  // Profit split the admin controls per category. On a sale attributed to this
  // category, the platform keeps adminPercent and the school earns schoolPercent
  // of the sale price; the vendor is paid the remainder. Kits derive their rate
  // from the category contributing the largest share of the kit's value.
  commission: {
    adminPercent: { type: Number, min: 0, max: 100, default: 0 },
    schoolPercent: { type: Number, min: 0, max: 100, default: 0 }
  },
  displayOrder: { type: Number, required: true, default: 0 }
}, { collection: 'categories' });

// Plugins
categorySchema.plugin(auditPlugin);
categorySchema.plugin(softDeletePlugin);

// Indexes
// slug is unique
categorySchema.index({ headerId: 1, displayOrder: 1 });
categorySchema.index({ status: 1, displayOrder: 1 });
// Soft delete compound index
categorySchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Category', categorySchema);
