const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const lmsChapterSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  title: { type: String, required: true },
  slug: { type: String, required: true },
  description: { type: String },
  displayOrder: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'published'],
    required: true,
    default: 'draft',
  },
}, { collection: 'lmsChapters' });

lmsChapterSchema.plugin(auditPlugin);
lmsChapterSchema.plugin(softDeletePlugin);

lmsChapterSchema.index({ courseId: 1, slug: 1 }, { unique: true });
lmsChapterSchema.index({ schoolId: 1, courseId: 1, displayOrder: 1 });
lmsChapterSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LmsChapter', lmsChapterSchema);
