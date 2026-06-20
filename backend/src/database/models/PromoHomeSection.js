const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const promoHomeSectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: {
    type: String,
    enum: ['product_carousel', 'category_grid', 'vendor_list', 'custom_banner'],
    required: true
  },
  queryConfig: { type: mongoose.Schema.Types.Mixed }, // Query to fetch items automatically
  manualItemIds: [{ type: mongoose.Schema.Types.ObjectId }], // Or manually picked
  targetAudience: {
    type: String,
    enum: ['all', 'parent', 'school'],
    required: true,
    default: 'all'
  },
  displayOrder: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'promoHomeSections' });

// Plugins
promoHomeSectionSchema.plugin(auditPlugin);

// Indexes
promoHomeSectionSchema.index({ targetAudience: 1, status: 1, displayOrder: 1 });

module.exports = mongoose.model('PromoHomeSection', promoHomeSectionSchema);
