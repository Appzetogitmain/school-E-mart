const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true, min: 0 },
    points: { type: Number, default: 1, min: 0 },
  },
  { _id: true }
);

const lmsQuizSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsCourse', required: true },
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsLesson' },
  title: { type: String, required: true },
  description: { type: String },
  passingScorePercent: { type: Number, default: 60, min: 0, max: 100 },
  timeLimitMin: { type: Number, min: 1 },
  maxAttempts: { type: Number, default: 1, min: 1 },
  questions: { type: [questionSchema], default: [] },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft',
  },
}, { collection: 'lmsQuizzes' });

lmsQuizSchema.plugin(auditPlugin);
lmsQuizSchema.plugin(softDeletePlugin);

lmsQuizSchema.index({ schoolId: 1, courseId: 1, status: 1 });
lmsQuizSchema.index({ lessonId: 1 }, { sparse: true });
lmsQuizSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('LmsQuiz', lmsQuizSchema);
