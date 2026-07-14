const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const lmsAssignmentSubmissionSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  assignmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsAssignment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String },
  // The submitted work. Bytes live in the private (non-served) uploads dir and are only
  // readable through the authorized attachment stream endpoint.
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  // Legacy: submissions made before attachments were recorded as Attachment documents
  // kept raw public /uploads paths here. Read-only — new submissions do not write it.
  attachmentUrls: [{ type: String }],
  submittedAt: { type: Date },
  // Stamped at submit time against the assignment's due date, so the teacher can still
  // see the work was late after the due date has long passed.
  isLate: { type: Boolean, default: false },
  score: { type: Number, min: 0 },
  // The teacher grades with letters but reports need the number, so both are kept
  // rather than deriving one from the other and losing the teacher's actual choice.
  letterGrade: { type: String },
  feedback: { type: String },
  gradedAt: { type: Date },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Set when a teacher sends work back for revision; cleared on resubmission.
  returnedAt: { type: Date },
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
