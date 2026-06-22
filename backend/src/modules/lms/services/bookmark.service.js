const bookmarkRepository = require('../repositories/bookmark.repository');
const progressRepository = require('../repositories/progress.repository').progressRepository;
const lessonRepository = require('../repositories/lesson.repository');

const bookmarkService = {
  async addBookmark(userId, schoolId, payload) {
    return bookmarkRepository.upsertBookmark(
      userId,
      schoolId,
      payload.courseId,
      payload.lessonId,
      payload.lastPositionSec || 0
    );
  },

  async removeBookmark(userId, schoolId, courseId, lessonId = null) {
    return bookmarkRepository.deleteBookmark(userId, courseId, lessonId);
  },

  async listBookmarks(userId, schoolId, query) {
    return bookmarkRepository.paginateBookmarks({ userId, schoolId }, query);
  },

  async getResumeLearning(userId, schoolId) {
    const bookmarks = await bookmarkRepository.findMany({ userId, schoolId });
    if (!bookmarks.length) return null;

    const latest = bookmarks.sort(
      (a, b) => new Date(b.audit?.updatedAt || 0) - new Date(a.audit?.updatedAt || 0)
    )[0];

    let lesson = null;
    if (latest.lessonId) {
      lesson = await lessonRepository.findById(latest.lessonId);
    }

    const progress = latest.lessonId
      ? await progressRepository.findByUserAndLesson(userId, latest.lessonId)
      : null;

    return { bookmark: latest, lesson, progress };
  },
};

module.exports = bookmarkService;
