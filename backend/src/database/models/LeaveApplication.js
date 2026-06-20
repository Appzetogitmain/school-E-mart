const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const leaveApplicationSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // parent who applied
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, required: true },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    required: true,
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewerRemarks: { type: String },
  reviewedAt: { type: Date }
}, { collection: 'leaveApplications' });

// Plugins
leaveApplicationSchema.plugin(auditPlugin);
leaveApplicationSchema.plugin(softDeletePlugin);

// Indexes
leaveApplicationSchema.index({ schoolId: 1, status: 1, startDate: 1 });
leaveApplicationSchema.index({ studentId: 1, 'audit.createdAt': -1 });
// Soft delete compound index
leaveApplicationSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LeaveApplication', leaveApplicationSchema);
