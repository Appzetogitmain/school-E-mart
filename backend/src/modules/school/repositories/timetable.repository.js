const TimetableSlot = require('../../../database/models/TimetableSlot');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class TimetableRepository extends BaseRepository {
  constructor() {
    super(TimetableSlot);
  }

  paginateTimetable(filter, queryString, options = {}) {
    return executePaginatedQuery(TimetableSlot, this.mergeFilter(filter), queryString, {
      defaultSort: 'dayOfWeek periodNumber',
      ...options,
    });
  }

  findConflicts({ schoolId, academicYear, dayOfWeek, startTime, endTime, teacherProfileId, classGrade, section, excludeId = null }) {
    const base = {
      schoolId,
      academicYear,
      dayOfWeek,
      'softDelete.isDeleted': { $ne: true },
    };
    if (excludeId) base._id = { $ne: excludeId };

    const timeOverlap = {
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
      ],
    };

    return Promise.all([
      TimetableSlot.findOne({
        ...base,
        teacherProfileId,
        ...timeOverlap,
      }).lean(),
      TimetableSlot.findOne({
        ...base,
        classGrade,
        section,
        ...timeOverlap,
      }).lean(),
    ]);
  }
}

module.exports = new TimetableRepository();
