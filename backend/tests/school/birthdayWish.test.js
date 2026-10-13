const mongoose = require('mongoose');
const birthdayService = require('../../src/modules/school/services/birthday.service');
const notificationService = require('../../src/services/notification/notification.service');
const originalSendToUser = notificationService.sendToUser;
const BirthdayWish = require('../../src/database/models/BirthdayWish');
const Notification = require('../../src/database/models/Notification');
const Student = require('../../src/database/models/Student');
const ChildProfile = require('../../src/database/models/ChildProfile');
const ParentProfile = require('../../src/database/models/ParentProfile');
const TeacherProfile = require('../../src/database/models/TeacherProfile');
const School = require('../../src/database/models/School');

const birthday = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const month = Number(parts.find((part) => part.type === 'month').value);
  const day = Number(parts.find((part) => part.type === 'day').value);
  return new Date(Date.UTC(2010, month - 1, day, 12));
};

describe('school birthday wishes', () => {
  let schoolId;
  let senderId;
  let sendSpy;

  beforeEach(async () => {
    schoolId = (await School.create({ name: 'Wish Test School', code: 'WISH', schoolRefNo: 'WISH' }))._id;
    senderId = new mongoose.Types.ObjectId();
    sendSpy = jest.spyOn(notificationService, 'sendToUser');
  });

  afterEach(() => sendSpy.mockRestore());

  test('student wish reaches linked parent and persists after reload', async () => {
    const parentId = new mongoose.Types.ObjectId();
    const student = await Student.create({
      schoolId, name: 'Aarav', schoolRefNo: 'STU1', classGrade: '5', section: 'A',
      status: 'active', dob: birthday(),
    });
    await ChildProfile.create({ parentUserId: parentId, studentId: student._id, name: 'Aarav', grade: '5' });

    const result = await birthdayService.wish(schoolId, 'student', student._id, senderId);
    expect(result).toEqual({ wished: true, recipientCount: 1 });
    expect(sendSpy).toHaveBeenCalledWith(String(parentId), expect.objectContaining({ type: 'event' }));
    const notification = await Notification.findOne({ userId: parentId }).lean();
    expect(notification).toMatchObject({ type: 'event', status: 'sent', isRead: false });
    expect(notification.body).toContain('Aarav');
    const refreshed = await birthdayService.getTodayBirthdays(schoolId);
    expect(refreshed.students[0].wished).toBe(true);
    expect(await BirthdayWish.countDocuments({ schoolId })).toBe(1);
    await expect(birthdayService.wish(schoolId, 'student', student._id, senderId)).rejects.toMatchObject({ statusCode: 409 });
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  test('teacher wish goes to the teacher account', async () => {
    const teacherUserId = new mongoose.Types.ObjectId();
    const teacher = await TeacherProfile.create({
      schoolId, userId: teacherUserId, approvalStatus: 'approved', dob: birthday(),
    });
    await birthdayService.wish(schoolId, 'teacher', teacher._id, senderId);
    expect(sendSpy).toHaveBeenCalledWith(String(teacherUserId), expect.any(Object));
    expect((await birthdayService.getTodayBirthdays(schoolId)).teachers[0].wished).toBe(true);
  });

  test('does not mark a wish sent without a linked recipient', async () => {
    const student = await Student.create({
      schoolId, name: 'No Parent', schoolRefNo: 'STU2', classGrade: '5', section: 'A',
      status: 'active', dob: birthday(),
    });
    await expect(birthdayService.wish(schoolId, 'student', student._id, senderId)).rejects.toMatchObject({ statusCode: 400 });
    expect(await BirthdayWish.countDocuments({ schoolId })).toBe(0);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  test('partial failure retries only the parent who missed the first wish', async () => {
    const firstParentId = new mongoose.Types.ObjectId();
    const secondParentId = new mongoose.Types.ObjectId();
    const secondProfile = await ParentProfile.create({ userId: secondParentId, referralCode: 'EMART9876' });
    const student = await Student.create({
      schoolId, name: 'Two Parents', schoolRefNo: 'STU3', classGrade: '5', section: 'A',
      status: 'active', dob: birthday(), parentProfileIds: [secondProfile._id],
    });
    await ChildProfile.create({ parentUserId: firstParentId, studentId: student._id, name: 'Two Parents', grade: '5' });
    const realSend = (userId, payload) => originalSendToUser.call(notificationService, userId, payload);
    sendSpy.mockImplementation((userId, payload) => userId === String(secondParentId)
      ? Promise.reject(new Error('temporary failure'))
      : realSend(userId, payload));

    await expect(birthdayService.wish(schoolId, 'student', student._id, senderId)).rejects.toMatchObject({ statusCode: 400 });
    expect((await BirthdayWish.findOne({ schoolId }).lean()).status).toBe('partial');
    expect(await Notification.countDocuments()).toBe(1);

    sendSpy.mockImplementation(realSend);
    await birthdayService.wish(schoolId, 'student', student._id, senderId);
    expect((await BirthdayWish.findOne({ schoolId }).lean()).status).toBe('sent');
    expect(await Notification.countDocuments()).toBe(2);
  });
});
