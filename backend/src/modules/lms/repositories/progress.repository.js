const LmsLessonProgress = require('../../../database/models/LmsLessonProgress');
const LmsEnrollment = require('../../../database/models/LmsEnrollment');
const { BaseRepository } = require('../../../repositories');

class ProgressRepository extends BaseRepository {
  constructor() {
    super(LmsLessonProgress, { useSoftDelete: false });
  }

  findByUserAndLesson(userId, lessonId) {
    return this.findOne({ userId, lessonId });
  }

  findByUserAndCourse(userId, courseId) {
    return this.findMany({ userId, courseId });
  }

  upsertProgress(userId, lessonId, courseId, payload) {
    return this.model
      .findOneAndUpdate(
        { userId, lessonId },
        {
          $set: {
            courseId,
            ...payload,
          },
          $setOnInsert: { userId, lessonId },
        },
        { upsert: true, new: true, runValidators: true }
      )
      .lean();
  }
}

class EnrollmentRepository extends BaseRepository {
  constructor() {
    super(LmsEnrollment, { useSoftDelete: false });
  }

  findEnrollment(schoolId, courseId, studentId) {
    return this.findOne({ schoolId, courseId, studentId });
  }

  findByStudent(schoolId, studentId, status = 'active') {
    return this.findMany({ schoolId, studentId, status });
  }

  findByUser(userId, status = 'active') {
    return this.findMany({ userId, status });
  }
}

module.exports = {
  progressRepository: new ProgressRepository(),
  enrollmentRepository: new EnrollmentRepository(),
};
