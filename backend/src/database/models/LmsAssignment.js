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
  // When the teacher told students the work starts, which is not necessarily the
  // moment the record was created.
  assignedDate: { type: Date },
  // Who the homework is for. The course is per grade+subject, so the section
  // lives here.
  classGrade: { type: String },
  section: { type: String },
  homeworkType: {
    type: String,
    enum: ['Written', 'Reading', 'Project', 'Online Quiz'],
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
  },
  reference: {
    textbook: { type: String },
    chapter: { type: String },
  },
  // Stamped from the authenticated teacher so the parent sees who set the work,
  // even when several teachers share one course.
  assignedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedByName: { type: String },
  maxScore: { type: Number, default: 100, min: 0 },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  // The card/detail thumbnail shown to parents. Deliberately separate from
  // `attachments` (the reference files a student needs) so it is never guessed at by
  // mime type and never double-counted or double-listed as a downloadable attachment.
  bannerAttachmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' },
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
// The parent homework feed: published homework for one school and grade, newest first.
// Without this the feed had no usable index — it fell back to scanning every assignment
// in the collection and sorting the survivors in memory on every page load.
lmsAssignmentSchema.index({
  schoolId: 1,
  status: 1,
  'softDelete.isDeleted': 1,
  classGrade: 1,
  assignedDate: -1,
});

module.exports = mongoose.model('LmsAssignment', lmsAssignmentSchema);
