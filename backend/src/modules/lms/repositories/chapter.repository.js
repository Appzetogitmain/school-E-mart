const LmsChapter = require('../../../database/models/LmsChapter');
const { BaseRepository } = require('../../../repositories');

class ChapterRepository extends BaseRepository {
  constructor() {
    super(LmsChapter);
  }

  findByCourse(courseId, schoolId) {
    return this.findMany({ courseId, schoolId }, { sort: { displayOrder: 1 } });
  }

  async reorder(courseId, schoolId, orderedIds) {
    const ops = orderedIds.map((id, index) =>
      LmsChapter.updateOne(
        this.mergeFilter({ _id: id, courseId, schoolId }),
        { $set: { displayOrder: index + 1 } }
      )
    );
    await Promise.all(ops);
    return this.findByCourse(courseId, schoolId);
  }
}

module.exports = new ChapterRepository();
