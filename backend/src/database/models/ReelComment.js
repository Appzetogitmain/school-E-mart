const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const reelCommentSchema = new mongoose.Schema({
  reelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  guestName: { type: String, default: 'School E-Mart Member' },
  body: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'hidden', 'flagged'],
    required: true,
    default: 'active'
  }
}, { collection: 'reelComments' });

// Plugins
reelCommentSchema.plugin(auditPlugin);
reelCommentSchema.plugin(softDeletePlugin);

// Indexes
reelCommentSchema.index({ reelId: 1, status: 1, 'audit.createdAt': -1 });
// Soft delete compound index
reelCommentSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('ReelComment', reelCommentSchema);
