const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const lmsCommentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsLesson', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsComment' },
  text: { type: String, required: true, maxlength: 1000 },
  moderationStatus: {
    type: String,
    enum: ['visible', 'hidden', 'flagged'],
    default: 'visible',
  },
}, { collection: 'lmsComments' });

lmsCommentSchema.plugin(auditPlugin);
lmsCommentSchema.plugin(softDeletePlugin);

lmsCommentSchema.index({ lessonId: 1, moderationStatus: 1, 'audit.createdAt': -1 });
lmsCommentSchema.index({ schoolId: 1, courseId: 1 });
lmsCommentSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LmsComment', lmsCommentSchema);
