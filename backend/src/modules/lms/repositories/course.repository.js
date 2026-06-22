const LmsCourse = require('../../../database/models/LmsCourse');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class CourseRepository extends BaseRepository {
  constructor() {
    super(LmsCourse);
  }

  paginateCourses(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsCourse, this.mergeFilter(filter), queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }

  findBySlug(slug, schoolId = null) {
    const filter = { slug };
    if (schoolId) filter.schoolId = schoolId;
    return this.findOne(filter);
  }
}

module.exports = new CourseRepository();
