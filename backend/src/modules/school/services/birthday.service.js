const Student = require('../../../database/models/Student');
const TeacherProfile = require('../../../database/models/TeacherProfile');
const User = require('../../../database/models/User');
const ChildProfile = require('../../../database/models/ChildProfile');
const ParentProfile = require('../../../database/models/ParentProfile');
const BirthdayWish = require('../../../database/models/BirthdayWish');
const Notification = require('../../../database/models/Notification');
const notificationService = require('../../../services/notification/notification.service');
const { BadRequestError, ConflictError, NotFoundError } = require('../../../common/errors');

const indiaDateParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
};

const indiaDateKey = (date) => {
  const { year, month, day } = indiaDateParts(date);
  return `${year}-${month}-${day}`;
};

const recipientUserIdsForStudent = async (student) => {
  const studentId = student._id || student.id;
  const children = await ChildProfile.find({
    $or: [{ studentId }, { _id: studentId }],
    'softDelete.isDeleted': { $ne: true },
  }).select('parentUserId').lean();

  const profiles = await ParentProfile.find({
    $or: [
      { _id: { $in: student.parentProfileIds || [] } },
      { studentId },
    ],
    'softDelete.isDeleted': { $ne: true },
  }).select('userId').lean();

  return [...new Set([
    ...children.map((child) => String(child.parentUserId)),
    ...profiles.map((profile) => String(profile.userId)),
    student.parentUserId ? String(student.parentUserId) : null,
  ].filter(Boolean))];
};

const birthdayService = {
  async getTodayBirthdays(schoolId, query = {}) {
    const targetDate = query.date ? new Date(query.date) : new Date();
    const targetParts = indiaDateParts(targetDate);
    const month = Number(targetParts.month);
    const day = Number(targetParts.day);
    const targetUtcMonth = targetDate.getUTCMonth() + 1;
    const targetUtcDay = targetDate.getUTCDate();

    const isBirthdayToday = (dobDate) => {
      if (!dobDate) return false;
      const d = new Date(dobDate);
      if (Number.isNaN(d.getTime())) return false;
      const localParts = indiaDateParts(d);
      const dMonth = Number(localParts.month);
      const dDay = Number(localParts.day);
      const dUtcMonth = d.getUTCMonth() + 1;
      const dUtcDay = d.getUTCDate();

      // Check both Indian Standard Time and UTC date components
      return (
        (dMonth === month && dDay === day) ||
        (dUtcMonth === targetUtcMonth && dUtcDay === targetUtcDay) ||
        (dUtcMonth === month && dUtcDay === day) ||
        (dMonth === targetUtcMonth && dDay === targetUtcDay)
      );
    };

    // 1. Query active students in the school
    const studentFilter = {
      schoolId,
      'softDelete.isDeleted': { $ne: true },
      status: { $nin: ['inactive', 'alumni'] },
    };
    if (query.classGrade) studentFilter.classGrade = query.classGrade;
    if (query.section) studentFilter.section = query.section;

    const allStudents = await Student.find(studentFilter)
      .select('_id name schoolRefNo rollNo classGrade section avatarUrl dob parentProfileIds')
      .lean();

    // 2. Also query active ChildProfiles in the school to support parents' child entries
    const childFilter = {
      schoolId,
      'softDelete.isDeleted': { $ne: true },
    };
    if (query.classGrade) childFilter.grade = query.classGrade;

    const allChildren = await ChildProfile.find(childFilter)
      .select('_id name schoolRefNo rollNo grade avatarUrl dob studentId parentUserId')
      .lean();

    const childrenByStudentId = new Map();
    for (const c of allChildren) {
      if (c.studentId) {
        childrenByStudentId.set(String(c.studentId), c);
      }
    }

    // Combine student records and fallback to child DOB if student DOB was missing
    const candidateMap = new Map();

    for (const s of allStudents) {
      const linkedChild = childrenByStudentId.get(String(s._id));
      const effectiveDob = s.dob || linkedChild?.dob;
      if (effectiveDob && isBirthdayToday(effectiveDob)) {
        candidateMap.set(String(s._id), {
          id: s._id,
          name: s.name,
          rollNo: s.rollNo || linkedChild?.rollNo,
          classGrade: s.classGrade || linkedChild?.grade,
          section: s.section || '',
          avatarUrl: s.avatarUrl || linkedChild?.avatarUrl,
          dob: effectiveDob,
          type: 'student',
          parentProfileIds: s.parentProfileIds || [],
          parentUserId: linkedChild?.parentUserId || null,
        });
      }
    }

    // Include unlinked children from ChildProfile whose birthday is today
    for (const c of allChildren) {
      const key = c.studentId ? String(c.studentId) : String(c._id);
      if (!candidateMap.has(key) && c.dob && isBirthdayToday(c.dob)) {
        candidateMap.set(key, {
          id: c.studentId || c._id,
          name: c.name,
          rollNo: c.rollNo,
          classGrade: c.grade,
          section: '',
          avatarUrl: c.avatarUrl,
          dob: c.dob,
          type: 'student',
          parentProfileIds: [],
          parentUserId: c.parentUserId || null,
          isChildProfile: !c.studentId,
        });
      }
    }

    const todayStudents = Array.from(candidateMap.values());

    // 3. Query approved teachers in the school
    const teacherProfiles = await TeacherProfile.find({
      schoolId,
      dob: { $ne: null },
      approvalStatus: 'approved',
      'softDelete.isDeleted': { $ne: true },
    })
      .populate({ path: 'userId', select: 'name fullName avatarUrl email phone' })
      .lean();

    const todayTeachers = teacherProfiles
      .filter((t) => isBirthdayToday(t.dob))
      .map((t) => ({
        id: t._id,
        name: t.userId?.name || t.userId?.fullName || 'Teacher',
        designation: t.designation || 'Teacher',
        department: t.department || '',
        avatarUrl: t.avatarUrl || t.userId?.avatarUrl,
        dob: t.dob,
        type: 'teacher',
      }));

    const dateKey = indiaDateKey(targetDate);
    const wishes = await BirthdayWish.find({
      schoolId,
      dateKey,
      status: { $in: ['sent', 'partial'] },
    }).select('recipientType recipientId').lean();

    const wished = new Set(wishes.map((wish) => `${wish.recipientType}:${wish.recipientId}`));

    return {
      students: todayStudents.map((student) => ({
        ...student,
        wished: wished.has(`student:${student.id}`),
      })),
      teachers: todayTeachers.map((teacher) => ({
        ...teacher,
        wished: wished.has(`teacher:${teacher.id}`),
      })),
      totalToday: todayStudents.length + todayTeachers.length,
      date: dateKey,
    };
  },

  async wish(schoolId, recipientType, recipientId, senderUserId) {
    if (!['student', 'teacher'].includes(recipientType)) {
      throw new BadRequestError('Invalid birthday recipient');
    }
    const today = await this.getTodayBirthdays(schoolId);
    const person = (recipientType === 'student' ? today.students : today.teachers)
      .find((item) => String(item.id) === String(recipientId));
    if (!person) throw new NotFoundError('No birthday for this person today');

    const key = { schoolId, recipientType, recipientId, dateKey: today.date };
    const existingWish = await BirthdayWish.findOne(key);
    if (existingWish?.status === 'sent') {
      throw new ConflictError('Birthday wish already sent today');
    }

    let recipientUserIds = [];
    if (recipientType === 'student') {
      let student = await Student.findOne({ _id: recipientId, schoolId })
        .select('parentProfileIds').lean();
      if (!student) {
        student = await ChildProfile.findOne({
          $or: [{ _id: recipientId }, { studentId: recipientId }],
          schoolId,
        }).select('parentUserId studentId').lean();
      }
      recipientUserIds = student ? await recipientUserIdsForStudent(student) : [];
      if (!recipientUserIds.length && person.parentUserId) {
        recipientUserIds.push(String(person.parentUserId));
      }
    } else {
      const teacher = await TeacherProfile.findOne({ _id: recipientId, schoolId })
        .select('userId').lean();
      recipientUserIds = teacher?.userId ? [String(teacher.userId)] : [];
    }

    if (!recipientUserIds.length) {
      throw new BadRequestError('No linked account can receive this birthday wish');
    }

    let wish = existingWish;
    if (wish?.status === 'sending') {
      await BirthdayWish.updateOne(
        { ...key, status: 'sending', updatedAt: { $lt: new Date(Date.now() - 2 * 60 * 1000) } },
        { $set: { status: 'partial' } }
      );
      wish = await BirthdayWish.findOne(key);
      if (wish?.status === 'sending') throw new ConflictError('Birthday wish is already being sent');
    }

    if (wish?.status === 'partial') {
      wish = await BirthdayWish.findOneAndUpdate(
        { ...key, status: 'partial' },
        { $set: { status: 'sending', updatedAt: new Date() } },
        { returnDocument: 'after' }
      );
      if (!wish) throw new ConflictError('Birthday wish is already being sent');
    } else if (!wish) {
      try {
        wish = await BirthdayWish.create({
          ...key, senderUserId, status: 'sending', deliveredUserIds: [],
        });
      } catch (error) {
        if (error.code === 11000) throw new ConflictError('Birthday wish is already being sent');
        throw error;
      }
    }

    const delivered = new Set(wish.deliveredUserIds.map(String));
    for (const userId of recipientUserIds) {
      if (delivered.has(userId)) continue;
      const alreadyRecorded = await Notification.exists({
        userId,
        'payload.data.wishId': String(wish._id),
      });
      if (alreadyRecorded) {
        delivered.add(userId);
        continue;
      }
      try {
        const result = await notificationService.sendToUser(userId, {
          notification: {
            title: 'Happy Birthday! 🎉',
            body: `Your school wishes ${person.name} a very happy birthday!`,
          },
          type: 'event',
          data: {
            type: 'birthday_wish', wishId: String(wish._id),
            schoolId: String(schoolId), recipientId: String(recipientId),
            route: '/notifications',
          },
        });
        if (result.record) delivered.add(userId);
      } catch (_) {
        // Keep partial so the school can retry failed recipients if needed
      }
    }

    const complete = recipientUserIds.every((userId) => delivered.has(userId));
    await BirthdayWish.updateOne({ _id: wish._id }, {
      $set: {
        deliveredUserIds: [...delivered], status: complete ? 'sent' : 'partial', updatedAt: new Date(),
      },
    });

    if (!complete) {
      throw new BadRequestError('Some recipients did not receive the birthday wish. Please retry.');
    }
    return { wished: true, recipientCount: recipientUserIds.length };
  },
};

module.exports = birthdayService;
