const LmsQuiz = require('../../../database/models/LmsQuiz');
const LmsQuizAttempt = require('../../../database/models/LmsQuizAttempt');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class QuizRepository extends BaseRepository {
  constructor() {
    super(LmsQuiz);
  }

  paginateQuizzes(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsQuiz, this.mergeFilter(filter), queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }
}

class QuizAttemptRepository extends BaseRepository {
  constructor() {
    super(LmsQuizAttempt, { useSoftDelete: false });
  }

  countAttempts(quizId, studentId) {
    return this.count({ quizId, studentId });
  }

  findLatestAttempt(quizId, studentId) {
    return this.model
      .findOne({ quizId, studentId })
      .sort({ attemptNumber: -1 })
      .lean();
  }

  paginateAttempts(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsQuizAttempt, filter, queryString, {
      defaultSort: '-startedAt',
      ...options,
    });
  }
}

module.exports = {
  quizRepository: new QuizRepository(),
  quizAttemptRepository: new QuizAttemptRepository(),
};
