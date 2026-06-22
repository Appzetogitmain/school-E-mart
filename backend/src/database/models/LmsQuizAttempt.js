const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedIndex: { type: Number, min: 0 },
  },
  { _id: false }
);

const lmsQuizAttemptSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'LmsQuiz', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attemptNumber: { type: Number, required: true, default: 1, min: 1 },
  answers: { type: [answerSchema], default: [] },
  scorePercent: { type: Number, min: 0, max: 100, default: 0 },
  passed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    required: true,
    default: 'in_progress',
  },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
}, { collection: 'lmsQuizAttempts', timestamps: false });

lmsQuizAttemptSchema.plugin(auditPlugin);

lmsQuizAttemptSchema.index({ quizId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
lmsQuizAttemptSchema.index({ userId: 1, quizId: 1, status: 1 });

module.exports = mongoose.model('LmsQuizAttempt', lmsQuizAttemptSchema);
