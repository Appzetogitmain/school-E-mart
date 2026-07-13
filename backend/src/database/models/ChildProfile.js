const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const childProfileSchema = new mongoose.Schema({
  parentUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dob: { type: Date },
  gender: { 
    type: String,
    enum: ['male', 'female', 'other', 'unspecified']
  },
  bloodGroup: { type: String },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  schoolRefNo: { type: String },
  grade: { type: String, required: true },
  rollNo: { type: String },
  avatarUrl: { type: String },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' } // linked once confirmed
}, { collection: 'childProfiles' });

// Plugins
childProfileSchema.plugin(auditPlugin);
childProfileSchema.plugin(softDeletePlugin);

// Indexes
childProfileSchema.index({ parentUserId: 1 });
childProfileSchema.index({ studentId: 1 }, { unique: true, sparse: true });
// Soft delete compound index
childProfileSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('ChildProfile', childProfileSchema);
