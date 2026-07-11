const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const teacherProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  employeeId: { type: String },
  designation: { type: String },
  department: { type: String },
  qualification: { type: String },
  experienceYears: { type: Number, min: 0 },
  joiningDate: { type: Date },
  dob: { type: Date },
  gender: { 
    type: String,
    enum: ['male', 'female', 'other', 'unspecified']
  },
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'other']
  },
  subjectsTaught: [{ type: String }],
  // One entry per class+section a teacher is permitted to teach. subjects
  // lists what they teach there; isClassTeacher marks the section's class
  // teacher (kept unique per section by the assignment service)
  classAssignments: [{
    class: { type: String },
    section: { type: String },
    subjects: [{ type: String }],
    isClassTeacher: { type: Boolean, default: false }
  }],
  avatarUrl: { type: String },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    required: true,
    default: 'pending'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date }
}, { collection: 'teacherProfiles' });

// Plugins
teacherProfileSchema.plugin(auditPlugin);
teacherProfileSchema.plugin(softDeletePlugin);

// Indexes
// userId is already unique
teacherProfileSchema.index({ schoolId: 1, approvalStatus: 1 });
// Soft delete compound index
teacherProfileSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('TeacherProfile', teacherProfileSchema);
