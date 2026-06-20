const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const lmsLessonSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
  durationSec: { type: Number },
  resources: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  displayOrder: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'published'],
    required: true,
    default: 'draft'
  }
}, { collection: 'lmsLessons' });

// Plugins
lmsLessonSchema.plugin(auditPlugin);
lmsLessonSchema.plugin(softDeletePlugin);

// Indexes
// slug is unique
lmsLessonSchema.index({ courseId: 1, status: 1, displayOrder: 1 });
// Soft delete compound index
lmsLessonSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LmsLesson', lmsLessonSchema);
