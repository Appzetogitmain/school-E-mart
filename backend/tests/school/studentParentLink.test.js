const mongoose = require('mongoose');
const studentService = require('../../src/modules/school/services/student.service');
const studentLookup = require('../../src/modules/lms/repositories/student.repository');
const School = require('../../src/database/models/School');
const Student = require('../../src/database/models/Student');
const User = require('../../src/database/models/User');
const ParentProfile = require('../../src/database/models/ParentProfile');
const ChildProfile = require('../../src/database/models/ChildProfile');

/**
 * The join between a self-registered parent and the school's own register. Until it is
 * made, the parent can read their class's homework but cannot hand any in — so the
 * school adding the child has to be what completes the link, not what duplicates it.
 *
 * linkParentByPhone is exercised directly: registerStudent wraps it in a transaction,
 * which the standalone test server cannot serve.
 */
describe('linking a self-registered parent to the school register', () => {
  let school;
  let parentUser;

  const link = (student, payload = {}) =>
    studentService.linkParentByPhone(
      school._id,
      student,
      { parentPhone: '9000000001', name: student.name, ...payload },
      undefined
    );

  const makeStudent = (overrides = {}) =>
    Student.create({
      schoolId: school._id,
      name: 'Asha',
      schoolRefNo: `S-${Math.random().toString(16).slice(2, 8)}`,
      classGrade: 'Class 5',
      section: 'A',
      status: 'active',
      ...overrides,
    });

  beforeEach(async () => {
    school = await School.create({
      code: 'LNK-001',
      name: 'Link School',
      schoolRefNo: 'LNK-REF-001',
    });

    // Exactly what auth.registerParent leaves behind: a parent, a profile, and a child
    // carrying a grade but no studentId.
    parentUser = await User.create({
      refId: 'SEM-P-LNK1',
      role: 'parent',
      status: 'active',
      name: 'Asha Parent',
      phone: '9000000001',
      tenantSchoolId: school._id,
    });
    await ParentProfile.create({ userId: parentUser._id, referralCode: 'EMART9001' });
    await ChildProfile.create({
      parentUserId: parentUser._id,
      name: 'Asha',
      schoolId: school._id,
      grade: 'Class 5',
    });
  });

  test('the existing unlinked child profile is adopted, not duplicated', async () => {
    const student = await makeStudent();
    await link(student);

    const profiles = await ChildProfile.find({ parentUserId: parentUser._id }).lean();
    expect(profiles).toHaveLength(1);
    expect(String(profiles[0].studentId)).toBe(String(student._id));
  });

  test('the parent can submit work once the school has added the child', async () => {
    const student = await makeStudent();
    await link(student);

    const resolved = await studentLookup.resolveLearnerContext(school._id, parentUser._id);
    expect(resolved.isLinked).toBe(true);
    expect(String(resolved.student._id)).toBe(String(student._id));
  });

  test('a sibling\'s profile is never claimed by the wrong child', async () => {
    await ChildProfile.create({
      parentUserId: parentUser._id,
      name: 'Bilal',
      schoolId: school._id,
      grade: 'Class 2',
    });

    const bilalStudent = await makeStudent({ name: 'Bilal', classGrade: 'Class 2' });
    await link(bilalStudent);

    const profiles = await ChildProfile.find({ parentUserId: parentUser._id }).lean();
    expect(profiles).toHaveLength(2);
    expect(String(profiles.find((p) => p.name === 'Bilal').studentId)).toBe(
      String(bilalStudent._id)
    );
    expect(profiles.find((p) => p.name === 'Asha').studentId).toBeFalsy();
  });

  test('a name containing regex characters does not break the lookup', async () => {
    await ChildProfile.create({
      parentUserId: parentUser._id,
      name: "O'Brien (Jr.)",
      schoolId: school._id,
      grade: 'Class 3',
    });

    const student = await makeStudent({ name: "O'Brien (Jr.)", classGrade: 'Class 3' });
    await link(student);

    const profile = await ChildProfile.findOne({
      parentUserId: parentUser._id,
      name: "O'Brien (Jr.)",
    }).lean();
    expect(String(profile.studentId)).toBe(String(student._id));
  });

  test('an already-linked profile is reused rather than adopted twice', async () => {
    const student = await makeStudent();
    await link(student);
    await link(student, { rollNo: '7' });

    const profiles = await ChildProfile.find({ parentUserId: parentUser._id }).lean();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].rollNo).toBe('7');
  });

  test('the student is linked back to the parent profile too', async () => {
    const student = await makeStudent();
    await link(student);

    const parentProfile = await ParentProfile.findOne({ userId: parentUser._id }).lean();
    const updated = await Student.findById(student._id).lean();
    expect(updated.parentProfileIds.map(String)).toContain(String(parentProfile._id));
  });
});
