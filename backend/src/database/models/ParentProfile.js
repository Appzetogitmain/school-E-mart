const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const parentProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  avatarUrl: { type: String },
  altPhone: { type: String, match: /^[6-9]\d{9}$/ },
  addressBookIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
  defaultAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' },
  activeChildId: { type: mongoose.Schema.Types.ObjectId, ref: 'ChildProfile' },
  gstin: { type: String },
  referralCode: { 
    type: String, 
    required: true, 
    unique: true,
    match: /^EMART\d{4}$/
  }
}, { collection: 'parentProfiles' });

// Plugins
parentProfileSchema.plugin(auditPlugin);
parentProfileSchema.plugin(softDeletePlugin);

// Indexes
// userId and referralCode are already unique via field definitions
// Soft delete compound index
parentProfileSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('ParentProfile', parentProfileSchema);
