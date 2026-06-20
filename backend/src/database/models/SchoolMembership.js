const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const schoolMembershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  role: {
    type: String,
    enum: ['school_admin', 'teacher', 'parent'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'removed'],
    required: true,
    default: 'pending'
  },
  joinedAt: { type: Date, default: Date.now },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String }
}, { collection: 'schoolMemberships' });

// Plugins
schoolMembershipSchema.plugin(auditPlugin);
schoolMembershipSchema.plugin(softDeletePlugin);

// Indexes
schoolMembershipSchema.index({ userId: 1, schoolId: 1, role: 1 }, { unique: true });
schoolMembershipSchema.index({ schoolId: 1, role: 1, status: 1 });
// Tenant index
schoolMembershipSchema.index({ schoolId: 1 });
// Soft delete compound index
schoolMembershipSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('SchoolMembership', schoolMembershipSchema);
