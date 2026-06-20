const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const adminProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  mobile: { 
    type: String, 
    required: true,
    match: /^[6-9]\d{9}$/
  },
  scopes: [{ type: String, default: '*' }]
}, { collection: 'adminProfiles' });

// Plugins
adminProfileSchema.plugin(auditPlugin);
adminProfileSchema.plugin(softDeletePlugin);

// Indexes
// userId is already unique
// Soft delete compound index
adminProfileSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('AdminProfile', adminProfileSchema);
