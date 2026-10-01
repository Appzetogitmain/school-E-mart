const mongoose = require('mongoose');
const birthdayService = require('../../src/modules/school/services/birthday.service');
const Student = require('../../src/database/models/Student');
const TeacherProfile = require('../../src/database/models/TeacherProfile');
const User = require('../../src/database/models/User');
const School = require('../../src/database/models/School');
const { generateUserRefId } = require('../../src/modules/school/utils/refId');

describe('birthdayService.getTodayBirthdays', () => {
  let school;
  let birthdayStudent;
  let otherStudent;
  let birthdayTeacherUser;
  let birthdayTeacherProfile;
  let otherTeacherUser;
  let otherTeacherProfile;

  beforeEach(async () => {
    school = await School.create({
      code: `SCH-${Date.now()}`,
      name: 'Springfield High School',
      schoolRefNo: `REF-${Date.now()}`,
    });

    const today = new Date();
    // Student with birthday today (year 2014)
    const bdayDate = new Date(2014, today.getMonth(), today.getDate());
    // Student with birthday next month
    const otherDate = new Date(2014, (today.getMonth() + 2) % 12, (today.getDate() + 5) % 28);

    birthdayStudent = await Student.create({
      schoolId: school._id,
      name: 'Aarav Sharma',
      schoolRefNo: `STU-${Date.now()}-1`,
      rollNo: '10',
      classGrade: '5',
      section: 'A',
      status: 'active',
      dob: bdayDate,
    });

    otherStudent = await Student.create({
      schoolId: school._id,
      name: 'Rohan Gupta',
      schoolRefNo: `STU-${Date.now()}-2`,
      rollNo: '11',
      classGrade: '5',
      section: 'A',
      status: 'active',
      dob: otherDate,
    });

    // Teacher with birthday today
    birthdayTeacherUser = await User.create({
      refId: generateUserRefId('TCH'),
      role: 'teacher',
      status: 'active',
      name: 'Pooja Verma',
      phone: `91${Math.floor(10000000 + Math.random() * 9000000)}`,
      email: `pooja${Date.now()}@test.com`,
    });

    birthdayTeacherProfile = await TeacherProfile.create({
      userId: birthdayTeacherUser._id,
      schoolId: school._id,
      designation: 'Senior Mathematics Teacher',
      department: 'Science & Math',
      approvalStatus: 'approved',
      dob: new Date(1990, today.getMonth(), today.getDate()),
    });

    // Teacher with different birthday
    otherTeacherUser = await User.create({
      refId: generateUserRefId('TCH'),
      role: 'teacher',
      status: 'active',
      name: 'Vikas Sharma',
      phone: `92${Math.floor(10000000 + Math.random() * 9000000)}`,
      email: `vikas${Date.now()}@test.com`,
    });

    otherTeacherProfile = await TeacherProfile.create({
      userId: otherTeacherUser._id,
      schoolId: school._id,
      designation: 'English Teacher',
      department: 'Languages',
      approvalStatus: 'approved',
      dob: otherDate,
    });
  });

  test('correctly retrieves students and teachers celebrating birthday today', async () => {
    const result = await birthdayService.getTodayBirthdays(school._id);

    expect(result).toBeDefined();
    expect(result.students).toHaveLength(1);
    expect(result.students[0].name).toBe('Aarav Sharma');
    expect(result.students[0].rollNo).toBe('10');
    expect(result.students[0].classGrade).toBe('5');
    expect(result.students[0].section).toBe('A');

    expect(result.teachers).toHaveLength(1);
    expect(result.teachers[0].name).toBe('Pooja Verma');
    expect(result.teachers[0].designation).toBe('Senior Mathematics Teacher');

    expect(result.totalToday).toBe(2);
  });

  test('filters students by classGrade and section when specified', async () => {
    // Filter by class 5 section A (matches birthdayStudent)
    const matchResult = await birthdayService.getTodayBirthdays(school._id, {
      classGrade: '5',
      section: 'A',
    });
    expect(matchResult.students).toHaveLength(1);

    // Filter by class 6 (does not match)
    const noMatchResult = await birthdayService.getTodayBirthdays(school._id, {
      classGrade: '6',
      section: 'B',
    });
    expect(noMatchResult.students).toHaveLength(0);
    // Teachers are still returned regardless of class filter
    expect(noMatchResult.teachers).toHaveLength(1);
  });
});
