const School = require('../../../database/models/School');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class SchoolRepository extends BaseRepository {
  constructor() {
    super(School);
  }

  paginateSchools(filter, queryString, options = {}) {
    return executePaginatedQuery(School, this.mergeFilter(filter), queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }

  findByCode(code) {
    return this.findOne({ code });
  }

  findBySchoolRefNo(schoolRefNo) {
    return this.findOne({ schoolRefNo });
  }

  updateSectionsConfig(schoolId, sectionsConfig) {
    return School.findOneAndUpdate(
      this.mergeFilter({ _id: schoolId }),
      { $set: { sectionsConfig } },
      { new: true, runValidators: true }
    ).lean();
  }

  updateGradesOffered(schoolId, gradesOffered) {
    return School.findOneAndUpdate(
      this.mergeFilter({ _id: schoolId }),
      { $set: { gradesOffered } },
      { new: true, runValidators: true }
    ).lean();
  }
}

module.exports = new SchoolRepository();
