const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const diaryEntrySchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classGrade: { type: String },
  section: { type: String },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // null if broadcast to class
  title: { type: String, required: true },
  content: { type: String, required: true },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  isReadByParent: { type: Boolean, default: false },
  readAt: { type: Date }
}, { collection: 'diaryEntries' });

// Plugins
diaryEntrySchema.plugin(auditPlugin);
diaryEntrySchema.plugin(softDeletePlugin);

// Indexes
diaryEntrySchema.index({ schoolId: 1, classGrade: 1, section: 1, 'audit.createdAt': -1 });
diaryEntrySchema.index({ studentId: 1, 'audit.createdAt': -1 });
// Soft delete compound index
diaryEntrySchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
