const mongoose = require('mongoose');
const Student = require('../../../database/models/Student');
const ChildProfile = require('../../../database/models/ChildProfile');
const ParentProfile = require('../../../database/models/ParentProfile');
const { BaseRepository } = require('../../../repositories');

const notDeleted = { 'softDelete.isDeleted': { $ne: true } };

// A studentId can arrive straight from a stale localStorage blob. Casting garbage
// throws a CastError that surfaces as a 500, so anything unusable is treated as
// "no student requested" and falls through to the normal resolution order.
const isUsableId = (value) => Boolean(value) && mongoose.Types.ObjectId.isValid(value);

class StudentLookupRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  async resolveStudentForUser(schoolId, userId, studentId = null) {
    const parentProfile = await ParentProfile.findOne({ userId, ...notDeleted }).lean();

    if (isUsableId(studentId)) {
      const student = await this.findOne({ _id: studentId, schoolId, status: 'active' });
      if (!student) return null;

      // 1. Check ChildProfile link
      const child = await ChildProfile.findOne({
        studentId: student._id,
        parentUserId: userId,
        ...notDeleted,
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

    // 1. Every ChildProfile for this parent at this school — not just the first one.
    //    A profile whose studentId is dangling (roster row deleted, or the child was
    //    made inactive) must not shadow a sibling profile that still resolves.
    const schoolChildren = await ChildProfile.find({
      parentUserId: userId,
      schoolId,
      ...notDeleted,
    }).lean();

    for (const child of schoolChildren) {
      if (!isUsableId(child.studentId)) continue;
      const student = await this.findById(child.studentId, { schoolId, status: 'active' });
      if (student) return { student, userId, childProfile: child };
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

    // 3. Fallback: any ChildProfile of this parent, in case the profile was created
    //    without a schoolId but its student sits in this school.
    const anyChildren = await ChildProfile.find({ parentUserId: userId, ...notDeleted }).lean();
    for (const child of anyChildren) {
      if (!isUsableId(child.studentId)) continue;
      const student = await this.findById(child.studentId, { schoolId, status: 'active' });
      if (student) return { student, userId, childProfile: child };
    }

    return null;
  }

  /**
   * The child a parent is asking about, for read-only class content such as the
   * homework feed.
   *
   * A roster `Student` row only exists once the school has added the child and linked
   * the parent. Self-registered parents (auth.controller `registerParent`) get a
   * ChildProfile with no `studentId` at all, so requiring a Student row here is what
   * left whole cohorts of parents staring at an empty homework page — the class's
   * homework exists, their child just isn't on the roster yet.
   *
   * Class-level content is not personal data, so an unlinked parent still gets a
   * learner context built from their own ChildProfile (school + declared grade).
   * `isLinked: false` marks it: anything that writes against a real student —
   * submitting work, progress, certificates — still goes through
   * `resolveStudentForUser` and is refused.
   */
  async resolveLearnerContext(schoolId, userId, studentId = null) {
    const resolved = await this.resolveStudentForUser(schoolId, userId, studentId);
    if (resolved) return { ...resolved, isLinked: true };

    // A requested studentId that does not resolve — a stale id left in the client's
    // storage from another child or another school, or someone else's child — is not
    // served. Resolution simply restarts without it, so the parent gets their own
    // child rather than a permanent 403 they cannot clear.
    if (isUsableId(studentId)) {
      const own = await this.resolveStudentForUser(schoolId, userId, null);
      if (own) return { ...own, isLinked: true };
    }

    const child =
      (await ChildProfile.findOne({ parentUserId: userId, schoolId, ...notDeleted }).lean()) ||
      (await ChildProfile.findOne({ parentUserId: userId, schoolId: null, ...notDeleted }).lean());

    if (!child) return null;

    return {
      student: {
        _id: null,
        schoolId,
        name: child.name,
        classGrade: child.grade,
        // ChildProfile has no section; without one the parent sees every section's
        // homework for the grade rather than none of it.
        section: null,
        rollNo: child.rollNo,
      },
      userId,
      childProfile: child,
      isLinked: false,
    };
  }
}

module.exports = new StudentLookupRepository();
