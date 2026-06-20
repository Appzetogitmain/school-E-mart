const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const promoBannerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment', required: true },
  linkUrl: { type: String },
  targetAudience: {
    type: String,
    enum: ['all', 'parent', 'school'],
    required: true,
    default: 'all'
  },
  position: {
    type: String,
    enum: ['home_top', 'home_middle', 'category_top', 'cart'],
    required: true
  },
  displayOrder: { type: Number, default: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'promoBanners' });

// Plugins
promoBannerSchema.plugin(auditPlugin);

// Indexes
promoBannerSchema.index({ position: 1, status: 1, validFrom: 1, validUntil: 1, displayOrder: 1 });

module.exports = mongoose.model('PromoBanner', promoBannerSchema);
