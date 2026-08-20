const mongoose = require('mongoose');
const { assertTeacherCourseAccess } = require('../../src/modules/lms/policies/lmsAccess.policy');
const School = require('../../src/database/models/School');
const TeacherProfile = require('../../src/database/models/TeacherProfile');

// Regression coverage for the authorization gap: approval alone used to be enough for
// any teacher to manage (edit/delete/grade) any other teacher's class-scoped homework
// in the school. assertTeacherCourseAccess must now check the requester's own
// classAssignments against the course's grade + subject.
describe('lmsAccess.policy: assertTeacherCourseAccess', () => {
  let schoolId;
  let teacherUserId;

  beforeEach(async () => {
    const school = await School.create({
      code: 'LMSACC-001',
      name: 'LMS Access Test School',
      schoolRefNo: 'LMSACC-REF-001',
    });
    schoolId = school._id.toString();
    teacherUserId = new mongoose.Types.ObjectId();
  });

  const req = (overrides = {}) => ({
    auth: { role: 'teacher', userId: teacherUserId },
    schoolId,
    ...overrides,
  });

  test('rejects a teacher with no approved profile in the school', async () => {
    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: 'Class 5', subject: 'Mathematics' })
    ).rejects.toMatchObject({ code: 'TEACHER_PROFILE_NOT_FOUND' });
  });

  test('rejects a teacher who is not assigned to the course class + subject', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [{ class: 'Class 6', section: 'A', subjects: ['Science'] }],
    });

    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: 'Class 5', subject: 'Mathematics' })
    ).rejects.toMatchObject({ code: 'LMS_COURSE_NOT_ASSIGNED' });
  });

  test('allows a teacher assigned to the course class + subject, in any section', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [
        { class: 'Class 5', section: 'B', subjects: ['Mathematics', 'Science'] },
      ],
    });

    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: 'Class 5', subject: 'Mathematics' })
    ).resolves.toBeUndefined();
  });

  test('grade comparison is normalized ("5" vs "Class 5")', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [{ class: '5', section: 'A', subjects: ['Mathematics'] }],
    });

    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: 'Class 5', subject: 'Mathematics' })
    ).resolves.toBeUndefined();
  });

  test('skips the assignment check for ungraded / whole-school catalog courses', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [{ class: 'Class 6', section: 'A', subjects: ['Science'] }],
    });

    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: null, subject: 'General' })
    ).resolves.toBeUndefined();
    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: 'All Grades', subject: 'General' })
    ).resolves.toBeUndefined();
  });

  // The class teacher runs the class. The assignment screen deliberately allows them to
  // be saved with no subject list of their own ("pick at least one subject, OR mark as
  // class teacher"), and requiring a subject match then locked them out of setting any
  // homework at all for their own class — every parent of that class saw a permanently
  // empty homework page while the rest of the school was fine.
  test('allows the class teacher of the grade even with no subjects of their own', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [{ class: 'PLAY GROUP', section: 'A', subjects: [], isClassTeacher: true }],
    });

    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: 'PLAY GROUP', subject: 'Drawing' })
    ).resolves.toBeUndefined();
  });

  test('being class teacher of one grade does not unlock another grade', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [{ class: 'PLAY GROUP', section: 'A', subjects: [], isClassTeacher: true }],
    });

    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: 'KG2', subject: 'Drawing' })
    ).rejects.toMatchObject({ code: 'LMS_COURSE_NOT_ASSIGNED' });
  });

  test('a subject teacher (not class teacher) is still held to their subject list', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [
        { class: 'Class 5', section: 'A', subjects: ['Science'], isClassTeacher: false },
      ],
    });

    await expect(
      assertTeacherCourseAccess(req(), { gradeClass: 'Class 5', subject: 'Mathematics' })
    ).rejects.toMatchObject({ code: 'LMS_COURSE_NOT_ASSIGNED' });
  });

  test('non-teacher roles are not checked here at all', async () => {
    await expect(
      assertTeacherCourseAccess(req({ auth: { role: 'school_admin', userId: teacherUserId } }), {
        gradeClass: 'Class 5',
        subject: 'Mathematics',
      })
    ).resolves.toBeUndefined();
  });
});
