const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const lmsAssignmentSubmissionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsAssignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  submittedAt: { type: Date },
  score: { type: Number, min: 0 },
  feedback: { type: String },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'graded', 'returned'],
    required: true,
    default: 'draft',
  },
}, { collection: 'lmsAssignmentSubmissions', timestamps: false });

lmsAssignmentSubmissionSchema.plugin(auditPlugin);

lmsAssignmentSubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });
lmsAssignmentSubmissionSchema.index({ studentId: 1, status: 1, submittedAt: -1 });

module.exports = mongoose.model('LmsAssignmentSubmission', lmsAssignmentSubmissionSchema);
