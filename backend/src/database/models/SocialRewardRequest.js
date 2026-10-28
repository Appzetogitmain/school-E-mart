const mongoose = require('mongoose');

const socialRewardRequestSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParentProfile' },
    customerName: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
    schoolName: { type: String, default: '' },
    studentName: { type: String, default: '' },
    tasks: {
      instagram: { type: Boolean, default: false },
      youtube: { type: Boolean, default: false },
      google: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: ['in_progress', 'pending_approval', 'approved', 'rejected'],
      default: 'in_progress',
      index: true,
    },
    submittedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, default: '' },
  },
  { collection: 'socialRewardRequests', timestamps: true }
);

socialRewardRequestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('SocialRewardRequest', socialRewardRequestSchema);
