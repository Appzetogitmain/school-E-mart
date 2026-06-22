const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const recentlyViewedProductSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audience: {
    type: String,
    enum: ['parent', 'school'],
    required: true,
  },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  viewedAt: { type: Date, default: Date.now },
}, { collection: 'recentlyViewedProducts', timestamps: false });

recentlyViewedProductSchema.plugin(auditPlugin);

recentlyViewedProductSchema.index({ userId: 1, audience: 1, viewedAt: -1 });
recentlyViewedProductSchema.index({ userId: 1, audience: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('RecentlyViewedProduct', recentlyViewedProductSchema);
