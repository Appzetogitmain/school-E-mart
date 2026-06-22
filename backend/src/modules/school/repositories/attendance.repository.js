const AttendanceRecord = require('../../../database/models/AttendanceRecord');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class AttendanceRepository extends BaseRepository {
  constructor() {
    super(AttendanceRecord, { useSoftDelete: false });
  }

  paginateAttendance(filter, queryString, options = {}) {
    return executePaginatedQuery(AttendanceRecord, filter, queryString, {
      defaultSort: '-date',
      ...options,
    });
  }

  findByStudentAndDate(schoolId, studentId, date) {
    return AttendanceRecord.findOne({ schoolId, studentId, date }).lean();
  }

  upsertRecord(filter, data) {
    return AttendanceRecord.findOneAndUpdate(filter, data, {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }).lean();
  }

  async monthlySummary(schoolId, year, month, classGrade, section) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const Student = require('../../../database/models/Student');
    const studentFilter = { schoolId, status: 'active', 'softDelete.isDeleted': { $ne: true } };
    if (classGrade) studentFilter.classGrade = classGrade;
    if (section) studentFilter.section = section;

    const students = await Student.find(studentFilter).select('_id name classGrade section').lean();
    const studentIds = students.map((s) => s._id);

    const records = await AttendanceRecord.find({
      schoolId,
      studentId: { $in: studentIds },
      date: { $gte: start, $lte: end },
    }).lean();

    const summaryByStudent = students.map((student) => {
      const studentRecords = records.filter((r) => String(r.studentId) === String(student._id));
      const counts = studentRecords.reduce(
        (acc, record) => {
          acc[record.status] = (acc[record.status] || 0) + 1;
          return acc;
        },
        { present: 0, absent: 0, half_day: 0, holiday: 0, leave: 0 }
      );
      return {
        studentId: student._id,
        name: student.name,
        classGrade: student.classGrade,
        section: student.section,
        counts,
        totalMarked: studentRecords.length,
      };
    });

    return {
      year,
      month,
      classGrade: classGrade || null,
      section: section || null,
      students: summaryByStudent,
    };
  }
}

module.exports = new AttendanceRepository();
