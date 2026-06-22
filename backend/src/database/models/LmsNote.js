const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const lmsNoteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse' },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsLesson' },
  title: { type: String, trim: true },
  content: { type: String, required: true },
}, { collection: 'lmsNotes' });

lmsNoteSchema.plugin(auditPlugin);
lmsNoteSchema.plugin(softDeletePlugin);

lmsNoteSchema.index({ userId: 1, schoolId: 1, 'audit.updatedAt': -1 });
lmsNoteSchema.index({ userId: 1, lessonId: 1 }, { sparse: true });
lmsNoteSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LmsNote', lmsNoteSchema);
