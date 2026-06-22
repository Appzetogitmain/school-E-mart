const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const { quizRepository, quizAttemptRepository } = require('../repositories/quiz.repository');
const courseService = require('./course.service');
const progressService = require('./progress.service');

const calculateScore = (quiz, answers) => {
  if (!quiz.questions?.length) return 0;
  let earned = 0;
  let total = 0;

  quiz.questions.forEach((question) => {
    const points = question.points || 1;
    total += points;
    const answer = answers.find((item) => String(item.questionId) === String(question._id));
    if (answer && answer.selectedIndex === question.correctIndex) {
      earned += points;
    }
  });

  return total === 0 ? 0 : Math.round((earned / total) * 100);
};

const quizService = {
  async createQuiz(schoolId, courseId, payload) {
    await courseService.getCourse(schoolId, courseId);
    return quizRepository.create({
      ...payload,
      schoolId,
      courseId,
      status: payload.status || 'draft',
      questions: payload.questions || [],
    });
  },

  async listQuizzes(schoolId, courseId, query) {
    await courseService.getCourse(schoolId, courseId);
    const filter = { schoolId, courseId };
    if (query.status) filter.status = query.status;
    return quizRepository.paginateQuizzes(filter, query);
  },

  async getQuiz(schoolId, courseId, quizId) {
    await courseService.getCourse(schoolId, courseId);
    const quiz = await quizRepository.findOne({ _id: quizId, schoolId, courseId });
    if (!quiz) throw new NotFoundError('Quiz not found', 'QUIZ_NOT_FOUND');
    return quiz;
  },

  async updateQuiz(schoolId, courseId, quizId, payload) {
    await this.getQuiz(schoolId, courseId, quizId);
    const quiz = await quizRepository.updateById(quizId, { $set: payload }, { schoolId, courseId });
    if (!quiz) throw new NotFoundError('Quiz not found', 'QUIZ_NOT_FOUND');
    return quiz;
  },

  async deleteQuiz(schoolId, courseId, quizId, deletedBy) {
    await this.getQuiz(schoolId, courseId, quizId);
    const quiz = await quizRepository.softDeleteById(quizId, { deletedBy });
    if (!quiz) throw new NotFoundError('Quiz not found', 'QUIZ_NOT_FOUND');
    return quiz;
  },

  async startAttempt(req, schoolId, courseId, quizId) {
    const quiz = await this.getQuiz(schoolId, courseId, quizId);
    if (quiz.status !== 'published') {
      throw new BadRequestError('Quiz is not available', 'QUIZ_NOT_AVAILABLE');
    }

    const student = req.lmsStudent;
    const userId = req.lmsUserId || req.auth.userId;
    const attemptCount = await quizAttemptRepository.countAttempts(quizId, student._id);
    if (attemptCount >= quiz.maxAttempts) {
      throw new ConflictError('Maximum quiz attempts reached', 'QUIZ_ATTEMPTS_EXCEEDED');
    }

    const inProgress = await quizAttemptRepository.findOne({
      quizId,
      studentId: student._id,
      status: 'in_progress',
    });
    if (inProgress) return inProgress;

    return quizAttemptRepository.create({
      schoolId,
      quizId,
      studentId: student._id,
      userId,
      attemptNumber: attemptCount + 1,
      status: 'in_progress',
    });
  },

  async submitAttempt(req, schoolId, courseId, quizId, attemptId, answers) {
    const quiz = await this.getQuiz(schoolId, courseId, quizId);
    const student = req.lmsStudent;
    const attempt = await quizAttemptRepository.findOne({
      _id: attemptId,
      quizId,
      studentId: student._id,
      status: 'in_progress',
    });
    if (!attempt) throw new NotFoundError('Quiz attempt not found', 'QUIZ_ATTEMPT_NOT_FOUND');

    const scorePercent = calculateScore(quiz, answers);
    const passed = scorePercent >= quiz.passingScorePercent;

    const updated = await quizAttemptRepository.updateById(attemptId, {
      $set: {
        answers,
        scorePercent,
        passed,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    if (quiz.lessonId) {
      await progressService.markLessonComplete(
        attempt.userId,
        quiz.lessonId,
        courseId,
        scorePercent
      );
    }

    await progressService.recalculateCourseProgress(attempt.userId, schoolId, courseId, student._id);
    return updated;
  },

  async getAttemptHistory(schoolId, courseId, quizId, query) {
    await this.getQuiz(schoolId, courseId, quizId);
    return quizAttemptRepository.paginateAttempts({ schoolId, quizId }, query);
  },
};

module.exports = quizService;
