const { NotFoundError } = require('../../../common/errors');
const lessonRepository = require('../repositories/lesson.repository');
const courseService = require('./course.service');
const chapterRepository = require('../repositories/chapter.repository');
const { uniqueSlug } = require('../utils/slug');
const LmsLesson = require('../../../database/models/LmsLesson');

const lessonService = {
  async createLesson(schoolId, courseId, payload, options = {}) {
    await courseService.getCourse(schoolId, courseId, options);
    if (payload.chapterId) {
      const chapter = await chapterRepository.findOne({ _id: payload.chapterId, courseId, schoolId });
      if (!chapter) throw new NotFoundError('Chapter not found', 'CHAPTER_NOT_FOUND');
    }
    const slug = await uniqueSlug(LmsLesson, payload.title);
    const lessons = await lessonRepository.findByCourse(courseId);
    return lessonRepository.create({
      ...payload,
      courseId,
      slug,
      displayOrder: payload.displayOrder ?? lessons.length + 1,
      status: payload.status || 'draft',
      lessonType: payload.lessonType || 'video',
      visibility: payload.visibility || 'visible',
    });
  },

  async listLessons(schoolId, courseId, query, options = {}) {
    await courseService.getCourse(schoolId, courseId, options);
    const filter = { courseId };
    if (query.chapterId) filter.chapterId = query.chapterId;
    if (query.status) filter.status = query.status;
    if (query.lessonType) filter.lessonType = query.lessonType;
    return lessonRepository.paginateLessons(filter, query);
  },

  async getLesson(schoolId, courseId, lessonId, options = {}) {
    await courseService.getCourse(schoolId, courseId, options);
    const lesson = await lessonRepository.findOne({ _id: lessonId, courseId });
    if (!lesson) throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
    return lesson;
  },

  async updateLesson(schoolId, courseId, lessonId, payload, options = {}) {
    await this.getLesson(schoolId, courseId, lessonId, options);
    const lesson = await lessonRepository.updateById(lessonId, { $set: payload }, { courseId });
    if (!lesson) throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
    return lesson;
  },

  async deleteLesson(schoolId, courseId, lessonId, deletedBy, options = {}) {
    await this.getLesson(schoolId, courseId, lessonId, options);
    const lesson = await lessonRepository.softDeleteById(lessonId, { deletedBy });
    if (!lesson) throw new NotFoundError('Lesson not found', 'LESSON_NOT_FOUND');
    return lesson;
  },

  async reorderLessons(schoolId, courseId, orderedIds) {
    await courseService.getCourse(schoolId, courseId);
    return lessonRepository.reorder(courseId, orderedIds);
  },
};

module.exports = lessonService;
