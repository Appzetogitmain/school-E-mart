const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const wishlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audience: {
    type: String,
    enum: ['parent', 'school'],
    required: true
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    addedAt: { type: Date, default: Date.now }
  }]
}, { collection: 'wishlists', timestamps: false });

// Plugins
wishlistSchema.plugin(auditPlugin);

// Indexes
wishlistSchema.index({ userId: 1, audience: 1 }, { unique: true });
wishlistSchema.index({ 'items.productId': 1 }); // Wishlist contains checks

module.exports = mongoose.model('Wishlist', wishlistSchema);
