const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const homeworkSubmissionSchema = new mongoose.Schema({
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'HomeworkAssignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  submittedAt: { type: Date, required: true, default: Date.now },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  studentRemarks: { type: String },
  teacherFeedback: { type: String },
  grade: { type: String },
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned_for_revision'],
    required: true,
    default: 'submitted'
  }
}, { collection: 'homeworkSubmissions', timestamps: false });

// Plugins
homeworkSubmissionSchema.plugin(auditPlugin);

// Indexes
// One submission per student per assignment
homeworkSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
homeworkSubmissionSchema.index({ studentId: 1, status: 1, submittedAt: -1 });

module.exports = mongoose.model('HomeworkSubmission', homeworkSubmissionSchema);
