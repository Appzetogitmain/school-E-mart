const mongoose = require('mongoose');
const User = require('../../src/database/models/User');
const Student = require('../../src/database/models/Student');
const School = require('../../src/database/models/School');
const ParentProfile = require('../../src/database/models/ParentProfile');
const ChildProfile = require('../../src/database/models/ChildProfile');
const DeviceToken = require('../../src/database/models/DeviceToken');
const Notification = require('../../src/database/models/Notification');
const attendanceService = require('../../src/modules/school/services/attendance.service');
const { generateUserRefId } = require('../../src/modules/school/utils/refId');

describe('Absent Student Notifications', () => {
  let school;
  let parentUser;
  let parentProfile;
  let student;
  let childProfile;
  let teacherReq;

  beforeEach(async () => {
    school = await School.create({
      code: 'SCH-ABS-01',
      name: 'Delhi Public School',
      schoolRefNo: 'DPS-ABS-01',
    });

    parentUser = await User.create({
      refId: generateUserRefId('P'),
      role: 'parent',
      status: 'active',
      name: 'Sunil Verma',
      phone: `98${Math.floor(10000000 + Math.random() * 9000000)}`,
      email: `parent${Date.now()}@test.com`,
    });

    parentProfile = await ParentProfile.create({
      userId: parentUser._id,
      referralCode: `EMART${Math.floor(1000 + Math.random() * 9000)}`,
    });

    student = await Student.create({
      schoolId: school._id,
      name: 'Aarav Verma',
      schoolRefNo: `STU-${Date.now()}`,
      classGrade: 'Class 5',
      section: 'B',
      status: 'active',
      parentProfileIds: [parentProfile._id],
    });

    childProfile = await ChildProfile.create({
      parentUserId: parentUser._id,
      name: 'Aarav Verma',
      schoolId: school._id,
      grade: 'Class 5',
      studentId: student._id,
    });

    await DeviceToken.create({
      userId: parentUser._id,
      token: 'fake-fcm-token-parent-123',
      platform: 'web',
      isActive: true,
    });

    teacherReq = {
      schoolId: String(school._id),
      auth: { userId: new mongoose.Types.ObjectId(), role: 'school' },
    };
  });

  afterEach(async () => {
    await Notification.deleteMany({ userId: parentUser?._id });
    await DeviceToken.deleteMany({ userId: parentUser?._id });
    await ChildProfile.deleteMany({ _id: childProfile?._id });
    await Student.deleteMany({ _id: student?._id });
    await ParentProfile.deleteMany({ _id: parentProfile?._id });
    await User.deleteMany({ _id: parentUser?._id });
    await School.deleteMany({ _id: school?._id });
  });

  test('successfully triggers notification to parent when student is marked ABSENT', async () => {
    const today = new Date('2026-09-30T00:00:00.000Z');

    const result = await attendanceService.markAttendance(teacherReq, {
      date: today,
      classGrade: 'Class 5',
      section: 'B',
      records: [{ studentId: student._id, status: 'absent' }],
    });

    expect(result.records).toHaveLength(1);
    expect(result.records[0].status).toBe('absent');

    // Wait a brief tick for async notifySafe to resolve
    await new Promise((r) => setTimeout(r, 350));

    const notifications = await Notification.find({ userId: parentUser._id });
    expect(notifications.length).toBeGreaterThanOrEqual(1);

    const absentNotif = notifications.find((n) => n.type === 'attendance');
    expect(absentNotif).toBeDefined();
    expect(absentNotif.title).toContain('ABSENT');
    expect(absentNotif.body).toContain('Aarav Verma');
    expect(absentNotif.actionUrl).toBe('/user/attendance');
    expect(absentNotif.payload?.data?.status).toBe('absent');
    expect(absentNotif.payload?.data?.studentId).toBe(String(student._id));
  });

  test('notification is also created when attendance status is updated to absent', async () => {
    const today = new Date('2026-09-30T00:00:00.000Z');

    // First mark as present
    const created = await attendanceService.markAttendance(teacherReq, {
      date: today,
      classGrade: 'Class 5',
      section: 'B',
      records: [{ studentId: student._id, status: 'present' }],
    });

    const recordId = created.records[0]._id;

    // Then update to absent
    await attendanceService.updateAttendance(teacherReq, recordId, { status: 'absent' });

    await new Promise((r) => setTimeout(r, 350));

    const notifications = await Notification.find({ userId: parentUser._id });
    const absentNotif = notifications.find(
      (n) => n.type === 'attendance' && n.title.includes('ABSENT')
    );
    expect(absentNotif).toBeDefined();
    expect(absentNotif.actionUrl).toBe('/user/attendance');
  });
});
