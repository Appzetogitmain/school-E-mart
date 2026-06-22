const { NotFoundError, ConflictError } = require('../../../common/errors');
const attendanceRepository = require('../repositories/attendance.repository');
const studentRepository = require('../repositories/student.repository');
const { assertTeacherClassAccess } = require('../policies/schoolAccess.policy');

const normalizeDate = (value) => {
  const date = new Date(value);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const attendanceService = {
  async markAttendance(req, { date, classGrade, section, records }) {
    if (req.auth.role === 'teacher') {
      await assertTeacherClassAccess(req, { classGrade, section });
    }

    const schoolId = req.schoolId;
    const attendanceDate = normalizeDate(date);
    const results = [];

    for (const record of records) {
      const student = await studentRepository.findOne({
        _id: record.studentId,
        schoolId,
        classGrade,
        section,
      });
      if (!student) continue;

      const saved = await attendanceRepository.upsertRecord(
        { schoolId, studentId: student._id, date: attendanceDate },
        {
          $set: {
            status: record.status,
            remarks: record.remarks || null,
            recordedBy: req.auth.userId,
          },
          $setOnInsert: { schoolId, studentId: student._id, date: attendanceDate },
        }
      );
      results.push(saved);
    }

    return results;
  },

  async updateAttendance(schoolId, attendanceId, payload, recordedBy) {
    const record = await attendanceRepository.findOne({ _id: attendanceId, schoolId });
    if (!record) throw new NotFoundError('Attendance record not found', 'ATTENDANCE_NOT_FOUND');

    return attendanceRepository.upsertRecord(
      { _id: attendanceId, schoolId },
      { $set: { ...payload, recordedBy } }
    );
  },

  async getDailyAttendance(schoolId, { date, classGrade, section }) {
    const attendanceDate = normalizeDate(date);
    const studentFilter = { schoolId };
    if (classGrade) studentFilter.classGrade = classGrade;
    if (section) studentFilter.section = section;

    const students = await studentRepository.findMany(studentFilter);
    const records = await attendanceRepository.findMany({ schoolId, date: attendanceDate });

    return students.map((student) => {
      const record = records.find((r) => String(r.studentId) === String(student._id));
      return {
        student,
        attendance: record || null,
      };
    });
  },

  async getAttendanceHistory(schoolId, query) {
    const filter = { schoolId };
    if (query.studentId) filter.studentId = query.studentId;
    if (query.date) filter.date = normalizeDate(query.date);
    if (query.status) filter.status = query.status;
    return attendanceRepository.paginateAttendance(filter, query);
  },

  async getMonthlySummary(schoolId, { year, month, classGrade, section }) {
    return attendanceRepository.monthlySummary(schoolId, year, month, classGrade, section);
  },
};

module.exports = attendanceService;
