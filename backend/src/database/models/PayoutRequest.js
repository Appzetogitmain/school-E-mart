const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const payoutRequestSchema = new mongoose.Schema({
  // Who is withdrawing. Vendors and schools both draw down their own ledger; the
  // owner type picks which ledger the approval debit is posted to.
  ownerType: {
    type: String,
    enum: ['vendor', 'school'],
    required: true,
    default: 'vendor'
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  amountPaise: { type: Number, required: true, min: 100 }, // min 1 INR
  bankDetailsSnapshot: {
    accountName: { type: String },
    bankName: { type: String },
    branch: { type: String },
    accountNumber: { type: String },
    accountNumberEnc: { type: String },
    accountNumberMasked: { type: String },
    ifsc: { type: String }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'rejected'],
    required: true,
    default: 'pending'
  },
  transactionReference: { type: String }, // Bank UTR etc.
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  rejectionReason: { type: String }
}, { collection: 'payoutRequests' });

// Plugins
payoutRequestSchema.plugin(auditPlugin);
payoutRequestSchema.plugin(softDeletePlugin);

// Indexes
payoutRequestSchema.index({ vendorId: 1, status: 1, 'audit.createdAt': -1 });
payoutRequestSchema.index({ schoolId: 1, status: 1, 'audit.createdAt': -1 });
payoutRequestSchema.index({ ownerType: 1, status: 1, 'audit.createdAt': -1 });
payoutRequestSchema.index({ status: 1, 'audit.createdAt': -1 });
// Soft delete compound index
payoutRequestSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);
