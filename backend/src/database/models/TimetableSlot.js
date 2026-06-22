const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const timetableSlotSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  academicYear: { type: String, required: true },
  classGrade: { type: String, required: true },
  section: { type: String, required: true },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6,
  },
  periodNumber: { type: Number, required: true, min: 1 },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  subjectCode: { type: String, required: true },
  subjectLabel: { type: String, required: true },
  teacherProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'TeacherProfile', required: true },
  room: { type: String },
}, { collection: 'timetableSlots' });

timetableSlotSchema.plugin(auditPlugin);
timetableSlotSchema.plugin(softDeletePlugin);

timetableSlotSchema.index(
  { schoolId: 1, academicYear: 1, classGrade: 1, section: 1, dayOfWeek: 1, periodNumber: 1 },
  { unique: true }
);
timetableSlotSchema.index({ schoolId: 1, teacherProfileId: 1, dayOfWeek: 1, startTime: 1 });
timetableSlotSchema.index({ schoolId: 1, classGrade: 1, section: 1, academicYear: 1 });
timetableSlotSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('TimetableSlot', timetableSlotSchema);
