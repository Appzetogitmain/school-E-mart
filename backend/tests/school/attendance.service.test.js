const mongoose = require('mongoose');
const attendanceService = require('../../src/modules/school/services/attendance.service');
const studentRepository = require('../../src/modules/school/repositories/student.repository');
const School = require('../../src/database/models/School');
const ParentProfile = require('../../src/database/models/ParentProfile');

describe('attendanceService', () => {
  let schoolId;
  let studentId;
  let adminReq;

  const makeReq = (overrides = {}) => ({
    schoolId: String(schoolId),
    auth: { userId: new mongoose.Types.ObjectId(), role: 'school' },
    ...overrides,
  });

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
    adminReq = makeReq();
  });

  test('prevents duplicate attendance for same student and date', async () => {
    const date = new Date('2026-06-15T00:00:00.000Z');
    await attendanceService.markAttendance(adminReq, {
      date,
      classGrade: 'Class 4',
      section: 'A',
      records: [{ studentId, status: 'present' }],
    });

    const { records } = await attendanceService.markAttendance(adminReq, {
      date,
      classGrade: 'Class 4',
      section: 'A',
      records: [{ studentId, status: 'absent' }],
    });

    expect(records).toHaveLength(1);
    expect(records[0].status).toBe('absent');
  });

  test('returns monthly attendance summary', async () => {
    await attendanceService.markAttendance(adminReq, {
      date: new Date('2026-06-10T00:00:00.000Z'),
      classGrade: 'Class 4',
      section: 'A',
      records: [{ studentId, status: 'present' }],
    });

    const summary = await attendanceService.getMonthlySummary(adminReq, {
      year: 2026,
      month: 6,
      classGrade: 'Class 4',
      section: 'A',
    });

    expect(summary.students).toHaveLength(1);
    expect(summary.students[0].counts.present).toBe(1);
  });

  test('reports students that are not markable instead of dropping them silently', async () => {
    const otherClassStudent = await studentRepository.create({
      schoolId,
      name: 'Priya Nair',
      schoolRefNo: 'STU-ATT-002',
      classGrade: 'Class 5',
      section: 'B',
      status: 'active',
    });

    const { records, skipped } = await attendanceService.markAttendance(adminReq, {
      date: new Date('2026-06-15T00:00:00.000Z'),
      classGrade: 'Class 4',
      section: 'A',
      records: [
        { studentId, status: 'present' },
        { studentId: otherClassStudent._id, status: 'present' },
      ],
    });

    expect(records).toHaveLength(1);
    expect(skipped).toEqual([String(otherClassStudent._id)]);
  });

  test('accepts a class grade written without the "Class" prefix', async () => {
    const { records } = await attendanceService.markAttendance(adminReq, {
      date: new Date('2026-06-15T00:00:00.000Z'),
      classGrade: '4',
      section: 'A',
      records: [{ studentId, status: 'late' }],
    });

    expect(records).toHaveLength(1);
    expect(records[0].status).toBe('late');
  });

  describe('getAttendanceHistory access scoping', () => {
    let parentReq;
    let ownChildId;

    beforeEach(async () => {
      const parentUserId = new mongoose.Types.ObjectId();
      const parentProfile = await ParentProfile.create({
        userId: parentUserId,
        referralCode: 'EMART0001',
      });

      const ownChild = await studentRepository.create({
        schoolId,
        name: 'Aarav Sharma',
        schoolRefNo: 'STU-ATT-003',
        classGrade: 'Class 4',
        section: 'A',
        status: 'active',
        parentProfileIds: [parentProfile._id],
      });
      ownChildId = ownChild._id;

      await attendanceService.markAttendance(adminReq, {
        date: new Date('2026-06-15T00:00:00.000Z'),
        classGrade: 'Class 4',
        section: 'A',
        records: [
          { studentId, status: 'present' },
          { studentId: ownChildId, status: 'absent' },
        ],
      });

      parentReq = makeReq({ auth: { userId: parentUserId, role: 'parent' } });
    });

    test('an unfiltered parent request returns only their own children', async () => {
      const { data } = await attendanceService.getAttendanceHistory(parentReq, {});

      expect(data).toHaveLength(1);
      expect(String(data[0].studentId)).toBe(String(ownChildId));
    });

    test('a parent cannot read another family\'s child by passing studentId', async () => {
      await expect(
        attendanceService.getAttendanceHistory(parentReq, { studentId })
      ).rejects.toMatchObject({ code: 'STUDENT_ACCESS_DENIED' });
    });

    test('a parent can read their own child by passing studentId', async () => {
      const { data } = await attendanceService.getAttendanceHistory(parentReq, {
        studentId: ownChildId,
      });

      expect(data).toHaveLength(1);
      expect(data[0].status).toBe('absent');
    });
  });
});
