const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const lmsLessonProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsLesson', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  status: {
    type: String,
    enum: ['started', 'completed'],
    required: true,
    default: 'started'
  },
  progressPercent: { type: Number, required: true, default: 0, min: 0, max: 100 },
  lastPositionSec: { type: Number, default: 0 },
  completedAt: { type: Date }
}, { collection: 'lmsLessonProgresses', timestamps: false });

// Plugins
lmsLessonProgressSchema.plugin(auditPlugin);

// Indexes
lmsLessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
lmsLessonProgressSchema.index({ userId: 1, courseId: 1, status: 1 });

module.exports = mongoose.model('LmsLessonProgress', lmsLessonProgressSchema);
