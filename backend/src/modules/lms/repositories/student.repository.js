const Student = require('../../../database/models/Student');
const ChildProfile = require('../../../database/models/ChildProfile');
const ParentProfile = require('../../../database/models/ParentProfile');
const { BaseRepository } = require('../../../repositories');

class StudentLookupRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  async resolveStudentForUser(schoolId, userId, studentId = null) {
    const parentProfile = await ParentProfile.findOne({
      userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();

    if (studentId) {
      const student = await this.findOne({ _id: studentId, schoolId, status: 'active' });
      if (!student) return null;

      // 1. Check ChildProfile link
      const child = await ChildProfile.findOne({
        studentId: student._id,
        parentUserId: userId,
        'softDelete.isDeleted': { $ne: true },
      }).lean();
      if (child) return { student, userId };

      // 2. Check ParentProfile link on Student
      if (
        parentProfile &&
        student.parentProfileIds?.some((id) => String(id) === String(parentProfile._id))
      ) {
        return { student, userId };
      }

      return null;
    }

    // 1. Check ChildProfile with schoolId
    const child = await ChildProfile.findOne({
      parentUserId: userId,
      schoolId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();

    if (child?.studentId) {
      const student = await this.findById(child.studentId, { schoolId, status: 'active' });
      if (student) return { student, userId };
    }

    // 2. Fallback: Student linked via ParentProfile
    if (parentProfile) {
      const student = await this.findOne({
        schoolId,
        parentProfileIds: parentProfile._id,
        status: 'active',
      });
      if (student) return { student, userId };
    }

    // 3. Fallback: Any active student linked via ChildProfile
    const anyChild = await ChildProfile.findOne({
      parentUserId: userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();
    if (anyChild?.studentId) {
      const student = await this.findById(anyChild.studentId, { schoolId, status: 'active' });
      if (student) return { student, userId };
    }

    return null;
  }
}

module.exports = new StudentLookupRepository();
