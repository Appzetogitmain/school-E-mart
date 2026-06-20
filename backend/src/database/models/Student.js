const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const studentSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  schoolRefNo: { type: String, required: true },
  rollNo: { type: String },
  classGrade: { type: String, required: true },
  section: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'inactive', 'alumni'],
    required: true,
    default: 'active'
  },
  dob: { type: Date },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'unspecified']
  },
  bloodGroup: { type: String },
  parentProfileIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ParentProfile' }]
}, { collection: 'students' });

// Plugins
studentSchema.plugin(auditPlugin);
studentSchema.plugin(softDeletePlugin);

// Indexes
studentSchema.index({ schoolId: 1, schoolRefNo: 1 }, { unique: true });
studentSchema.index({ schoolId: 1, classGrade: 1, section: 1, status: 1 });
// Soft delete compound index
studentSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Student', studentSchema);
