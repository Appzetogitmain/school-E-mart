const { NotFoundError } = require('../../../common/errors');
const chapterRepository = require('../repositories/chapter.repository');
const courseService = require('./course.service');
const { uniqueSlug } = require('../utils/slug');
const LmsChapter = require('../../../database/models/LmsChapter');

const chapterService = {
  async createChapter(schoolId, courseId, payload) {
    await courseService.getCourse(schoolId, courseId);
    const slug = await uniqueSlug(LmsChapter, payload.title, { courseId });
    const chapters = await chapterRepository.findByCourse(courseId, schoolId);
    return chapterRepository.create({
      ...payload,
      schoolId,
      courseId,
      slug,
      displayOrder: payload.displayOrder ?? chapters.length + 1,
      status: payload.status || 'draft',
    });
  },

  async listChapters(schoolId, courseId) {
    await courseService.getCourse(schoolId, courseId);
    return chapterRepository.findByCourse(courseId, schoolId);
  },

  async updateChapter(schoolId, courseId, chapterId, payload) {
    await courseService.getCourse(schoolId, courseId);
    const chapter = await chapterRepository.updateById(
      chapterId,
      { $set: payload },
      { schoolId, courseId }
    );
    if (!chapter) throw new NotFoundError('Chapter not found', 'CHAPTER_NOT_FOUND');
    return chapter;
  },

  async deleteChapter(schoolId, courseId, chapterId, deletedBy) {
    await courseService.getCourse(schoolId, courseId);
    const chapter = await chapterRepository.softDeleteById(chapterId, { deletedBy });
    if (!chapter || String(chapter.courseId) !== String(courseId)) {
      throw new NotFoundError('Chapter not found', 'CHAPTER_NOT_FOUND');
    }
    return chapter;
  },

  async reorderChapters(schoolId, courseId, orderedIds) {
    await courseService.getCourse(schoolId, courseId);
    return chapterRepository.reorder(courseId, schoolId, orderedIds);
  },
};

module.exports = chapterService;
