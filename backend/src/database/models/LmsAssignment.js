const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const lmsAssignmentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsChapter' },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsLesson' },
  title: { type: String, required: true },
  description: { type: String },
  instructions: { type: String },
  dueDate: { type: Date },
  maxScore: { type: Number, default: 100, min: 0 },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft',
  },
}, { collection: 'lmsAssignments' });

lmsAssignmentSchema.plugin(auditPlugin);
lmsAssignmentSchema.plugin(softDeletePlugin);

lmsAssignmentSchema.index({ schoolId: 1, courseId: 1, status: 1, dueDate: 1 });
lmsAssignmentSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LmsAssignment', lmsAssignmentSchema);
