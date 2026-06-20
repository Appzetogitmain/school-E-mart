const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const lmsCourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  thumbnailId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
  category: { type: String }, // e.g. "Parenting", "Child Psychology"
  targetAudience: {
    type: String,
    enum: ['parents', 'teachers', 'all'],
    required: true,
    default: 'parents'
  },
  instructorName: { type: String },
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft'
  },
  displayOrder: { type: Number, default: 0 }
}, { collection: 'lmsCourses' });

// Plugins
lmsCourseSchema.plugin(auditPlugin);
lmsCourseSchema.plugin(softDeletePlugin);

// Indexes
// slug is unique
lmsCourseSchema.index({ status: 1, targetAudience: 1, displayOrder: 1 });
// Soft delete compound index
lmsCourseSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LmsCourse', lmsCourseSchema);
