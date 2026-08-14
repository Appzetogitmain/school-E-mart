const mongoose = require('mongoose');
const assignmentService = require('../../src/modules/lms/services/assignment.service');
const courseService = require('../../src/modules/lms/services/course.service');
const studentRepository = require('../../src/modules/lms/repositories/student.repository');
const { assertEnrollmentAccess } = require('../../src/modules/lms/policies/lmsAccess.policy');
const { ROLES } = require('../../src/constants/roles');
const School = require('../../src/database/models/School');
const Student = require('../../src/database/models/Student');
const ChildProfile = require('../../src/database/models/ChildProfile');
const ParentProfile = require('../../src/database/models/ParentProfile');
const LmsCourse = require('../../src/database/models/LmsCourse');

/**
 * Everything here is a way the parent homework page came back empty while the teacher
 * could see the homework they had just published. The feed is the only surface the
 * parent has, so each of these has to keep working.
 */
describe('parent homework visibility', () => {
  let schoolId;
  let parentUserId;
  let teacherUserId;

  const publish = (courseId, overrides = {}) =>
    assignmentService.createAssignment(
      schoolId,
      courseId,
      {
        title: 'Homework',
        classGrade: 'Class 5',
        status: 'published',
        ...overrides,
      },
      { userId: teacherUserId }
    );

  const feedFor = (student) => assignmentService.getStudentHomeworkFeed(schoolId, student);

  beforeEach(async () => {
    const school = await School.create({
      code: 'HWV-001',
      name: 'Visibility School',
      schoolRefNo: 'HWV-REF-001',
    });
    schoolId = school._id;
    parentUserId = new mongoose.Types.ObjectId();
    teacherUserId = new mongoose.Types.ObjectId();
  });

  const makeStudent = (overrides = {}) =>
    Student.create({
      schoolId,
      name: 'Asha',
      schoolRefNo: `S-${Math.random().toString(16).slice(2, 8)}`,
      classGrade: 'Class 5',
      section: 'A',
      status: 'active',
      ...overrides,
    });

  describe('the course a homework hangs off must not be able to hide it', () => {
    test('homework filed under a platform course (schoolId: null) still reaches the parent', async () => {
      // ensureCourse used to be able to pick one of these off the teacher's course
      // list, and the feed — which only ever looked at the school's own courses —
      // then dropped every piece of homework filed under it.
      const platformCourse = await LmsCourse.create({
        schoolId: null,
        title: 'Platform Maths',
        slug: 'platform-maths',
        subject: 'Mathematics',
        gradeClass: 'All Grades',
        status: 'published',
        targetAudience: 'students',
      });

      await publish(platformCourse._id, { title: 'Set on a platform course' });
      const student = await makeStudent();

      const feed = await feedFor(student);
      expect(feed.map((row) => row.assignment.title)).toEqual(['Set on a platform course']);
      // The course is still resolved for display even though it is not the school's.
      expect(feed[0].course.subject).toBe('Mathematics');
    });

    test('homework on a course still in draft is not withheld', async () => {
      const draftCourse = await courseService.createCourse(schoolId, {
        title: 'Science - 5',
        subject: 'Science',
        gradeClass: 'Class 5',
        status: 'draft',
        targetAudience: 'students',
      });

      await publish(draftCourse._id, { title: 'On a draft course' });
      const student = await makeStudent();

      expect((await feedFor(student)).map((row) => row.assignment.title)).toEqual([
        'On a draft course',
      ]);
    });

    test('homework whose course row is gone is still delivered', async () => {
      const course = await courseService.createCourse(schoolId, {
        title: 'Hindi - 5',
        subject: 'Hindi',
        gradeClass: 'Class 5',
        status: 'published',
        targetAudience: 'students',
      });
      await publish(course._id, { title: 'Orphaned' });
      await LmsCourse.deleteOne({ _id: course._id });

      const feed = await feedFor(await makeStudent());
      expect(feed.map((row) => row.assignment.title)).toEqual(['Orphaned']);
      expect(feed[0].course).toBeNull();
    });

    test('a course targeted at "All Grades" is treated as everyone\'s, not nobody\'s', async () => {
      const course = await courseService.createCourse(schoolId, {
        title: 'Assembly',
        gradeClass: 'All Grades',
        status: 'published',
        targetAudience: 'students',
      });
      await publish(course._id, { title: 'Whole school', classGrade: undefined });

      expect((await feedFor(await makeStudent())).map((r) => r.assignment.title)).toEqual([
        'Whole school',
      ]);
    });

    test('draft homework is never shown, whatever its course', async () => {
      const course = await courseService.createCourse(schoolId, {
        title: 'Maths - 5',
        gradeClass: 'Class 5',
        status: 'published',
        targetAudience: 'students',
      });
      await publish(course._id, { title: 'Not ready', status: 'draft' });

      expect(await feedFor(await makeStudent())).toEqual([]);
    });
  });

  describe('grade and section are free text and must be compared as such', () => {
    let course;

    beforeEach(async () => {
      course = await courseService.createCourse(schoolId, {
        title: 'Maths - 5',
        subject: 'Mathematics',
        gradeClass: '5',
        status: 'published',
        targetAudience: 'students',
      });
    });

    test('"Class 5" homework reaches a student recorded as grade "5"', async () => {
      await publish(course._id, { title: 'For 5', classGrade: 'Class 5', section: undefined });
      const student = await makeStudent({ classGrade: '5' });

      expect((await feedFor(student)).map((r) => r.assignment.title)).toEqual(['For 5']);
    });

    test.each([['a'], ['Section A'], ['  A ']])(
      'section %p on the roster still matches homework set for "A"',
      async (rosterSection) => {
        await publish(course._id, { title: 'For 5-A', section: 'A' });
        const student = await makeStudent({ section: rosterSection });

        expect((await feedFor(student)).map((r) => r.assignment.title)).toEqual(['For 5-A']);
      }
    );

    test('another section\'s homework is still kept out', async () => {
      await publish(course._id, { title: 'For 5-B', section: 'B' });
      const student = await makeStudent({ section: 'A' });

      expect(await feedFor(student)).toEqual([]);
    });

    test('a child with no section on record sees the whole grade rather than nothing', async () => {
      await publish(course._id, { title: 'For 5-A', section: 'A' });
      await publish(course._id, { title: 'For 5-B', section: 'B' });

      const feed = await feedFor({ _id: null, classGrade: 'Class 5', section: null });
      expect(feed.map((r) => r.assignment.title).sort()).toEqual(['For 5-A', 'For 5-B']);
    });

    test('another grade\'s homework never leaks in', async () => {
      const other = await courseService.createCourse(schoolId, {
        title: 'Maths - 6',
        gradeClass: '6',
        status: 'published',
        targetAudience: 'students',
      });
      await publish(other._id, { title: 'For 6', classGrade: 'Class 6', section: undefined });
      await publish(course._id, { title: 'For 5', classGrade: 'Class 5', section: undefined });

      const feed = await feedFor(await makeStudent({ classGrade: '5' }));
      expect(feed.map((r) => r.assignment.title)).toEqual(['For 5']);
    });

    test('the teacher\'s roster includes students whose section is spelled differently', async () => {
      const assignment = await publish(course._id, { title: 'For 5-A', section: 'A' });
      await makeStudent({ name: 'Asha', section: 'a' });
      await makeStudent({ name: 'Bilal', section: 'Section A' });
      await makeStudent({ name: 'Chetan', section: 'B' });

      const { rows } = await assignmentService.getSubmissionRoster(
        schoolId,
        course._id,
        assignment._id
      );
      expect(rows.map((row) => row.student.name).sort()).toEqual(['Asha', 'Bilal']);
    });
  });

  describe('a child the school has not put on the register yet', () => {
    // How self-registration leaves things: a ChildProfile with a school and a grade,
    // and no Student row at all. Requiring one is what made the homework page 403.
    const selfRegistered = () =>
      ChildProfile.create({
        parentUserId,
        name: 'Unlinked Child',
        schoolId,
        grade: 'Class 5',
      });

    test('is resolved for reading, and flagged as not linked', async () => {
      await selfRegistered();

      const resolved = await studentRepository.resolveLearnerContext(schoolId, parentUserId);
      expect(resolved).toBeTruthy();
      expect(resolved.isLinked).toBe(false);
      expect(resolved.student._id).toBeNull();
      expect(resolved.student.classGrade).toBe('Class 5');
    });

    test('sees their class\'s homework', async () => {
      await selfRegistered();
      const course = await courseService.createCourse(schoolId, {
        title: 'Maths - 5',
        gradeClass: 'Class 5',
        status: 'published',
        targetAudience: 'students',
      });
      await publish(course._id, { title: 'Fractions', section: 'A' });

      const resolved = await studentRepository.resolveLearnerContext(schoolId, parentUserId);
      const feed = await feedFor(resolved.student);

      expect(feed.map((r) => r.assignment.title)).toEqual(['Fractions']);
      expect(feed[0].submission).toBeNull();
    });

    test('still cannot submit work — that needs a real roster student', async () => {
      await selfRegistered();
      const course = await courseService.createCourse(schoolId, {
        title: 'Maths - 5',
        gradeClass: 'Class 5',
        status: 'published',
        targetAudience: 'students',
      });

      const req = { schoolId: String(schoolId), auth: { role: ROLES.PARENT, userId: parentUserId } };
      await expect(assertEnrollmentAccess(req, course._id)).rejects.toMatchObject({
        code: 'STUDENT_NOT_LINKED',
      });
    });

    test('a parent with no child at this school is still refused', async () => {
      await expect(
        studentRepository.resolveLearnerContext(schoolId, parentUserId)
      ).resolves.toBeNull();
    });
  });

  describe('resolving which child is being asked about', () => {
    test('a dangling ChildProfile does not shadow a sibling profile that resolves', async () => {
      // The roster row this one points at is gone; the parent must still get the child
      // who is actually on the register.
      await ChildProfile.create({
        parentUserId,
        name: 'Deleted Child',
        schoolId,
        grade: 'Class 2',
        studentId: new mongoose.Types.ObjectId(),
      });
      const student = await makeStudent({ name: 'Real Child' });
      await ChildProfile.create({
        parentUserId,
        name: 'Real Child',
        schoolId,
        grade: 'Class 5',
        studentId: student._id,
      });

      const resolved = await studentRepository.resolveLearnerContext(schoolId, parentUserId);
      expect(resolved.isLinked).toBe(true);
      expect(resolved.student.name).toBe('Real Child');
    });

    test('a stale studentId from client storage falls back to the parent\'s own child', async () => {
      const student = await makeStudent({ name: 'Real Child' });
      await ChildProfile.create({
        parentUserId,
        name: 'Real Child',
        schoolId,
        grade: 'Class 5',
        studentId: student._id,
      });

      const resolved = await studentRepository.resolveLearnerContext(
        schoolId,
        parentUserId,
        new mongoose.Types.ObjectId() // not theirs, and not on file
      );
      expect(resolved.isLinked).toBe(true);
      expect(String(resolved.student._id)).toBe(String(student._id));
    });

    test('an unparseable studentId is ignored rather than throwing', async () => {
      const student = await makeStudent();
      await ChildProfile.create({
        parentUserId, name: 'Asha', schoolId, grade: 'Class 5', studentId: student._id,
      });

      const resolved = await studentRepository.resolveLearnerContext(
        schoolId,
        parentUserId,
        'undefined'
      );
      expect(String(resolved.student._id)).toBe(String(student._id));
    });

    test('another parent\'s child is never served', async () => {
      const someoneElsesChild = await makeStudent({ name: 'Not Yours' });
      await ChildProfile.create({
        parentUserId: new mongoose.Types.ObjectId(),
        name: 'Not Yours',
        schoolId,
        grade: 'Class 5',
        studentId: someoneElsesChild._id,
      });

      // The requesting parent has no child here at all, so there is nothing to fall
      // back to either.
      await expect(
        studentRepository.resolveLearnerContext(schoolId, parentUserId, someoneElsesChild._id)
      ).resolves.toBeNull();
    });

    test('a student linked only through ParentProfile resolves', async () => {
      const parentProfile = await ParentProfile.create({
        userId: parentUserId,
        referralCode: 'EMART1234',
      });
      const student = await makeStudent({
        name: 'Via Parent Profile',
        parentProfileIds: [parentProfile._id],
      });

      const resolved = await studentRepository.resolveLearnerContext(schoolId, parentUserId);
      expect(resolved.isLinked).toBe(true);
      expect(String(resolved.student._id)).toBe(String(student._id));
    });
  });
});
