const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const noticeSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  targetAudience: {
    type: String,
    enum: ['all', 'parents', 'teachers', 'staff', 'specific_classes'],
    required: true
  },
  targetClasses: [{
    classGrade: { type: String },
    sections: [{ type: String }]
  }],
  publishDate: { type: Date, required: true, default: Date.now },
  expiryDate: { type: Date },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft'
  },
  isNotified: { type: Boolean, default: false }
}, { collection: 'notices' });

// Plugins
noticeSchema.plugin(auditPlugin);
noticeSchema.plugin(softDeletePlugin);

// Indexes
noticeSchema.index({ schoolId: 1, status: 1, publishDate: -1 });
noticeSchema.index({ status: 1, isNotified: 1, publishDate: 1 });
// Soft delete compound index
noticeSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Notice', noticeSchema);
