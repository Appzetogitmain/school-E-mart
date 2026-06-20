const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const schoolStaffProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  designation: { type: String },
  avatarUrl: { type: String },
  altPhone: { type: String, match: /^[6-9]\d{9}$/ },
  permissions: [{ type: String }]
}, { collection: 'schoolStaffProfiles' });

// Plugins
schoolStaffProfileSchema.plugin(auditPlugin);
schoolStaffProfileSchema.plugin(softDeletePlugin);

// Indexes
// userId is already unique
schoolStaffProfileSchema.index({ schoolId: 1 });
// Soft delete compound index
schoolStaffProfileSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('SchoolStaffProfile', schoolStaffProfileSchema);
