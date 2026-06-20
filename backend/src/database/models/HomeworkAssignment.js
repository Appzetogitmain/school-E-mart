const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const homeworkAssignmentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  classGrade: { type: String, required: true },
  sections: [{ type: String, required: true }],
  subject: { type: String, required: true },
  assignedDate: { type: Date, required: true, default: Date.now },
  dueDate: { type: Date, required: true },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft'
  }
}, { collection: 'homeworkAssignments' });

// Plugins
homeworkAssignmentSchema.plugin(auditPlugin);
homeworkAssignmentSchema.plugin(softDeletePlugin);

// Indexes
homeworkAssignmentSchema.index({ schoolId: 1, classGrade: 1, sections: 1, status: 1, dueDate: 1 });
homeworkAssignmentSchema.index({ teacherId: 1, 'audit.createdAt': -1 });
// Soft delete compound index
homeworkAssignmentSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('HomeworkAssignment', homeworkAssignmentSchema);
