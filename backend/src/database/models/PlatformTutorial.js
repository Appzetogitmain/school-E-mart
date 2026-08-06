const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

/**
 * "Learn more about platform" videos — short how-it-works tutorials the super
 * admin uploads so parents/students, teachers, and school admins can learn
 * their portal from their own Profile page. Not related to LmsCourse, which
 * is school-scoped academic content for students.
 */
const platformTutorialSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment', required: true },
  thumbnailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
  durationSec: { type: Number },
  targetAudience: {
    type: String,
    enum: ['all', 'parent', 'teacher', 'school'],
    required: true,
    default: 'all',
  },
  order: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft',
  },
  metrics: {
    views: { type: Number, default: 0 },
  },
}, { collection: 'platformTutorials' });

// Plugins
platformTutorialSchema.plugin(auditPlugin);
platformTutorialSchema.plugin(softDeletePlugin);

// Indexes
platformTutorialSchema.index({ targetAudience: 1, status: 1, order: 1 });
platformTutorialSchema.index({ status: 1, 'audit.createdAt': -1 });
// Soft delete compound index
platformTutorialSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('PlatformTutorial', platformTutorialSchema);
