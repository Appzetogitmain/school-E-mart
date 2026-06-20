const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const supportAccountManagerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // The admin user assigned
  managedVendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' }],
  managedSchoolIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'School' }],
  specialization: [{ type: String }], // 'onboarding', 'disputes', 'finance'
  maxCapacity: { type: Number, default: 50 },
  status: {
    type: String,
    enum: ['active', 'on_leave', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'supportAccountManagers' });

// Plugins
supportAccountManagerSchema.plugin(auditPlugin);
supportAccountManagerSchema.plugin(softDeletePlugin);

// Indexes
// userId is unique
supportAccountManagerSchema.index({ status: 1 });
// Soft delete compound index
supportAccountManagerSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('SupportAccountManager', supportAccountManagerSchema);
