const LmsLesson = require('../../../database/models/LmsLesson');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class LessonRepository extends BaseRepository {
  constructor() {
    super(LmsLesson);
  }

  paginateLessons(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsLesson, this.mergeFilter(filter), queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }

  findByCourse(courseId, filter = {}) {
    return this.findMany({ courseId, ...filter }, { sort: { displayOrder: 1 } });
  }

  async reorder(courseId, orderedIds) {
    const ops = orderedIds.map((id, index) =>
      LmsLesson.updateOne(this.mergeFilter({ _id: id, courseId }), { $set: { displayOrder: index + 1 } })
    );
    await Promise.all(ops);
    return this.findByCourse(courseId);
  }

  countPublished(courseId) {
    return this.count({ courseId, status: 'published', visibility: 'visible' });
  }
}

module.exports = new LessonRepository();
