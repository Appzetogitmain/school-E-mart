const mongoose = require('mongoose');
const timetableService = require('../../src/modules/school/services/timetable.service');
const lookupRepository = require('../../src/modules/school/repositories/lookup.repository');
const School = require('../../src/database/models/School');
const TeacherProfile = require('../../src/database/models/TeacherProfile');

describe('timetableService', () => {
  let schoolId;
  let teacherProfileId;

  beforeEach(async () => {
    const school = await School.create({
      code: 'TST-001',
      name: 'Test School',
      schoolRefNo: 'REF-001',
    });
    schoolId = school._id;

    const teacher = await TeacherProfile.create({
      userId: new mongoose.Types.ObjectId(),
      schoolId,
      approvalStatus: 'approved',
    });
    teacherProfileId = teacher._id;

    await lookupRepository.create({
      type: 'subject',
      code: 'MATH',
      label: 'Mathematics',
      group: String(schoolId),
      displayOrder: 1,
      status: 'active',
    });
  });

  test('detects teacher scheduling conflict', async () => {
    await timetableService.createSlot(schoolId, {
      academicYear: '2025-26',
      classGrade: 'Class 5',
      section: 'A',
      dayOfWeek: 1,
      periodNumber: 1,
      startTime: '09:00',
      endTime: '10:00',
      subjectCode: 'MATH',
      teacherProfileId,
    });

    await expect(
      timetableService.createSlot(schoolId, {
        academicYear: '2025-26',
        classGrade: 'Class 6',
        section: 'B',
        dayOfWeek: 1,
        periodNumber: 2,
        startTime: '09:30',
        endTime: '10:30',
        subjectCode: 'MATH',
        teacherProfileId,
      })
    ).rejects.toMatchObject({ code: 'TEACHER_TIMETABLE_CONFLICT' });
  });

  test('detects classroom scheduling conflict', async () => {
    await timetableService.createSlot(schoolId, {
      academicYear: '2025-26',
      classGrade: 'Class 5',
      section: 'A',
      dayOfWeek: 2,
      periodNumber: 1,
      startTime: '11:00',
      endTime: '12:00',
      subjectCode: 'MATH',
      teacherProfileId,
    });

    const otherTeacher = await TeacherProfile.create({
      userId: new mongoose.Types.ObjectId(),
      schoolId,
      approvalStatus: 'approved',
    });

    await expect(
      timetableService.createSlot(schoolId, {
        academicYear: '2025-26',
        classGrade: 'Class 5',
        section: 'A',
        dayOfWeek: 2,
        periodNumber: 2,
        startTime: '11:30',
        endTime: '12:30',
        subjectCode: 'MATH',
        teacherProfileId: otherTeacher._id,
      })
    ).rejects.toMatchObject({ code: 'CLASSROOM_TIMETABLE_CONFLICT' });
  });
});
