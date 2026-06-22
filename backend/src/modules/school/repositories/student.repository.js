const Student = require('../../../database/models/Student');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class StudentRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  paginateStudents(filter, queryString, options = {}) {
    const merged = { ...this.mergeFilter(filter) };
    if (queryString.search) {
      const term = String(queryString.search).trim();
      merged.$or = [
        { name: { $regex: term, $options: 'i' } },
        { schoolRefNo: { $regex: term, $options: 'i' } },
        { rollNo: { $regex: term, $options: 'i' } },
      ];
    }
    const { search, ...restQuery } = queryString;
    return executePaginatedQuery(Student, merged, restQuery, {
      defaultSort: 'name',
      ...options,
    });
  }

  countBySchool(schoolId) {
    return this.count({ schoolId });
  }

  findBySchoolRefNo(schoolId, schoolRefNo) {
    return this.findOne({ schoolId, schoolRefNo });
  }
}

module.exports = new StudentRepository();
