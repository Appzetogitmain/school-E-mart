const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const lmsCertificateSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  certificateNo: { type: String, required: true, unique: true },
  issuedAt: { type: Date, default: Date.now },
  completionPercent: { type: Number, required: true, min: 0, max: 100 },
}, { collection: 'lmsCertificates', timestamps: false });

lmsCertificateSchema.plugin(auditPlugin);

lmsCertificateSchema.index({ schoolId: 1, courseId: 1, studentId: 1 }, { unique: true });
lmsCertificateSchema.index({ userId: 1, issuedAt: -1 });

module.exports = mongoose.model('LmsCertificate', lmsCertificateSchema);
