const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const lmsEnrollmentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'withdrawn'],
    required: true,
    default: 'active',
  },
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { collection: 'lmsEnrollments', timestamps: false });

lmsEnrollmentSchema.plugin(auditPlugin);

lmsEnrollmentSchema.index({ schoolId: 1, courseId: 1, studentId: 1 }, { unique: true });
lmsEnrollmentSchema.index({ userId: 1, courseId: 1, status: 1 });
lmsEnrollmentSchema.index({ schoolId: 1, studentId: 1, status: 1 });

module.exports = mongoose.model('LmsEnrollment', lmsEnrollmentSchema);
