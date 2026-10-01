const Student = require('../../../database/models/Student');
const TeacherProfile = require('../../../database/models/TeacherProfile');
const User = require('../../../database/models/User');

const birthdayService = {
  async getTodayBirthdays(schoolId, query = {}) {
    const targetDate = query.date ? new Date(query.date) : new Date();
    const month = targetDate.getMonth() + 1;
    const day = targetDate.getDate();
    const utcMonth = targetDate.getUTCMonth() + 1;
    const utcDay = targetDate.getUTCDate();

    const isBirthdayToday = (dobDate) => {
      if (!dobDate) return false;
      const d = new Date(dobDate);
      if (Number.isNaN(d.getTime())) return false;
      const m = d.getMonth() + 1;
      const dy = d.getDate();
      const um = d.getUTCMonth() + 1;
      const udy = d.getUTCDate();
      return (
        (m === month && dy === day) ||
        (um === utcMonth && udy === utcDay) ||
        (m === utcMonth && dy === utcDay) ||
        (um === month && udy === day)
      );
    };

    // Query active students in the school
    const studentFilter = {
      schoolId,
      dob: { $ne: null },
      status: 'active',
      'softDelete.isDeleted': { $ne: true },
    };
    if (query.classGrade) studentFilter.classGrade = query.classGrade;
    if (query.section) studentFilter.section = query.section;

    const allStudents = await Student.find(studentFilter)
      .select('_id name schoolRefNo rollNo classGrade section avatarUrl dob')
      .lean();

    const todayStudents = allStudents
      .filter((s) => isBirthdayToday(s.dob))
      .map((s) => ({
        id: s._id,
        name: s.name,
        rollNo: s.rollNo,
        classGrade: s.classGrade,
        section: s.section,
        avatarUrl: s.avatarUrl,
        dob: s.dob,
        type: 'student',
      }));

    // Query approved teachers in the school
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

    return {
      students: todayStudents,
      teachers: todayTeachers,
      totalToday: todayStudents.length + todayTeachers.length,
      date: targetDate.toISOString().slice(0, 10),
    };
  },
};

module.exports = birthdayService;
