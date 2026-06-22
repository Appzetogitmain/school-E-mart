const mongoose = require('mongoose');
const attendanceService = require('../../src/modules/school/services/attendance.service');
const studentRepository = require('../../src/modules/school/repositories/student.repository');
const School = require('../../src/database/models/School');

describe('attendanceService', () => {
  let schoolId;
  let studentId;

  beforeEach(async () => {
    const school = await School.create({
      code: 'ATT-001',
      name: 'Attendance School',
      schoolRefNo: 'ATT-REF-001',
    });
    schoolId = school._id;

    const student = await studentRepository.create({
      schoolId,
      name: 'Rahul Sharma',
      schoolRefNo: 'STU-ATT-001',
      classGrade: 'Class 4',
      section: 'A',
      status: 'active',
    });
    studentId = student._id;
  });

  test('prevents duplicate attendance for same student and date', async () => {
    const req = {
      schoolId: String(schoolId),
      auth: { userId: new mongoose.Types.ObjectId(), role: 'school' },
    };

    const date = new Date('2026-06-15T00:00:00.000Z');
    await attendanceService.markAttendance(req, {
      date,
      classGrade: 'Class 4',
      section: 'A',
      records: [{ studentId, status: 'present' }],
    });

    const updated = await attendanceService.markAttendance(req, {
      date,
      classGrade: 'Class 4',
      section: 'A',
      records: [{ studentId, status: 'absent' }],
    });

    expect(updated).toHaveLength(1);
    expect(updated[0].status).toBe('absent');
  });

  test('returns monthly attendance summary', async () => {
    const req = {
      schoolId: String(schoolId),
      auth: { userId: new mongoose.Types.ObjectId(), role: 'school' },
    };

    await attendanceService.markAttendance(req, {
      date: new Date('2026-06-10T00:00:00.000Z'),
      classGrade: 'Class 4',
      section: 'A',
      records: [{ studentId, status: 'present' }],
    });

    const summary = await attendanceService.getMonthlySummary(schoolId, {
      year: 2026,
      month: 6,
      classGrade: 'Class 4',
      section: 'A',
    });

    expect(summary.students).toHaveLength(1);
    expect(summary.students[0].counts.present).toBe(1);
  });
});
