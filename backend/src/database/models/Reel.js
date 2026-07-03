const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const reelSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment', required: true },
  thumbnailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
  durationSec: { type: Number },
  storeName: { type: String },
  category: { type: String, default: 'All' },
  musicLabel: { type: String },
  linkedProduct: {
    title: { type: String },
    price: { type: Number },
    mrp: { type: Number },
    url: { type: String },
    imageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
    imageUrl: { type: String },
    badge: { type: String, default: 'RECOMMENDED' },
  },
  tags: [{ type: String }],
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  metrics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft'
  }
}, { collection: 'reels' });

// Plugins
reelSchema.plugin(auditPlugin);
reelSchema.plugin(softDeletePlugin);

// Indexes
// slug is unique
reelSchema.index({ status: 1, 'metrics.views': -1 });
reelSchema.index({ status: 1, 'audit.createdAt': -1 });
// Soft delete compound index
reelSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Reel', reelSchema);
