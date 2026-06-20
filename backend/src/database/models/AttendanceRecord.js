const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const attendanceRecordSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  date: { type: Date, required: true },
  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'holiday', 'leave'],
    required: true
  },
  remarks: { type: String },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'attendanceRecords', timestamps: false });

// Plugins
attendanceRecordSchema.plugin(auditPlugin);

// Indexes
// One attendance record per student per day
attendanceRecordSchema.index({ schoolId: 1, studentId: 1, date: 1 }, { unique: true });
attendanceRecordSchema.index({ schoolId: 1, date: 1, status: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
