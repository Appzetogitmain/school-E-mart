const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const productReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String },
  body: { type: String },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }]
}, { collection: 'productReviews' });

// Plugins
productReviewSchema.plugin(auditPlugin);
productReviewSchema.plugin(softDeletePlugin);

// Indexes
productReviewSchema.index({ productId: 1, 'audit.createdAt': -1 });
productReviewSchema.index({ userId: 1, 'audit.createdAt': -1 });
// Soft delete compound index
productReviewSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('ProductReview', productReviewSchema);
