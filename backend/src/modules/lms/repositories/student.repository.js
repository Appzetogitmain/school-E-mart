const Student = require('../../../database/models/Student');
const ChildProfile = require('../../../database/models/ChildProfile');
const { BaseRepository } = require('../../../repositories');

class StudentLookupRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  async resolveStudentForUser(schoolId, userId, studentId = null) {
    if (studentId) {
      const student = await this.findOne({ _id: studentId, schoolId, status: 'active' });
      if (!student) return null;
      const child = await ChildProfile.findOne({
        studentId: student._id,
        parentUserId: userId,
        'softDelete.isDeleted': { $ne: true },
      }).lean();
      if (child) return { student, userId };
      return null;
    }

    const child = await ChildProfile.findOne({
      parentUserId: userId,
      schoolId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();

    if (!child?.studentId) return null;
    const student = await this.findById(child.studentId, { schoolId, status: 'active' });
    return student ? { student, userId } : null;
  }
}

module.exports = new StudentLookupRepository();
