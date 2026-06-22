const LmsBookmark = require('../../../database/models/LmsBookmark');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class BookmarkRepository extends BaseRepository {
  constructor() {
    super(LmsBookmark, { useSoftDelete: false });
  }

  findBookmark(userId, courseId, lessonId = null) {
    const filter = { userId, courseId };
    if (lessonId) filter.lessonId = lessonId;
    return this.findOne(filter);
  }

  paginateBookmarks(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsBookmark, filter, queryString, {
      defaultSort: '-audit.updatedAt',
      ...options,
    });
  }

  upsertBookmark(userId, schoolId, courseId, lessonId, lastPositionSec = 0) {
    return this.model
      .findOneAndUpdate(
        { userId, courseId, lessonId: lessonId || null },
        {
          $set: { schoolId, lastPositionSec },
          $setOnInsert: { userId, courseId, lessonId: lessonId || null },
        },
        { upsert: true, new: true, runValidators: true }
      )
      .lean();
  }

  async deleteBookmark(userId, courseId, lessonId = null) {
    const filter = { userId, courseId };
    if (lessonId) filter.lessonId = lessonId;
    const bookmark = await this.findOne(filter);
    if (!bookmark) return null;
    await this.model.deleteOne({ _id: bookmark._id });
    return bookmark;
  }
}

module.exports = new BookmarkRepository();
