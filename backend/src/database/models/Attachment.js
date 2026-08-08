const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const attachmentSchema = new mongoose.Schema({
  ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  purpose: {
    type: String,
    enum: [
      'profile_avatar', 'product_image', 'kit_image', 'uniform_set_image',
      'homework_attachment', 'submission', 'diary_attachment', 'notice_attachment',
      'return_proof', 'rfq_attachment', 'reel_video', 'reel_thumb',
      'lms_video', 'lms_thumb', 'banner_image', 'category_image', 'header_image', 'header_icon', 'kit_product_template', 'kyc_doc',
      'tutorial_video', 'tutorial_thumb'
    ],
    required: true
  },
  storageKey: { type: String, required: true },
  mime: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  width: { type: Number },
  height: { type: Number },
  durationSec: { type: Number },
  checksum: { type: String },
  scanStatus: {
    type: String,
    enum: ['pending', 'clean', 'infected'],
    required: true,
    default: 'pending'
  }
}, { collection: 'attachments' });

// Plugins
attachmentSchema.plugin(auditPlugin);
attachmentSchema.plugin(softDeletePlugin);

// Indexes
attachmentSchema.index({ ownerUserId: 1, purpose: 1, 'audit.createdAt': -1 });
attachmentSchema.index({ scanStatus: 1, 'audit.createdAt': -1 });
// Soft delete compound index
attachmentSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Attachment', attachmentSchema);
