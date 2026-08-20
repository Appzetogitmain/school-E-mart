const mongoose = require('mongoose');
const classService = require('../../src/modules/school/services/class.service');
const School = require('../../src/database/models/School');
const TeacherProfile = require('../../src/database/models/TeacherProfile');
const Lookup = require('../../src/database/models/Lookup');

/**
 * A class teacher held no subjects of their own, so the homework form offered them an
 * empty subject dropdown and refused to submit — "You aren't assigned any subject for
 * this class & section". Nobody could set homework for that class, and every parent in
 * it saw a permanently empty homework page while the rest of the school was fine.
 *
 * listClasses is what feeds that dropdown, so the fallback is verified here.
 */
describe('listClasses: subjects offered to a class teacher', () => {
  let schoolId;
  let teacherUserId;

  beforeEach(async () => {
    const school = await School.create({
      code: 'CTS-001',
      name: 'Class Teacher Subjects School',
      schoolRefNo: 'CTS-REF-001',
      gradesOffered: ['PLAY GROUP', 'NURSERY'],
      sectionsConfig: [
        { class: 'PLAY GROUP', sections: ['A'] },
        { class: 'NURSERY', sections: ['A'] },
      ],
    });
    schoolId = school._id;
    teacherUserId = new mongoose.Types.ObjectId();
  });

  const asClassTeacher = (overrides = {}) =>
    TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [
        { class: 'PLAY GROUP', section: 'A', subjects: [], isClassTeacher: true },
      ],
      ...overrides,
    });

  const subjectsFor = async (classGrade, section) => {
    const classes = await classService.listClasses(schoolId, { userId: teacherUserId });
    const entry = classes.find((item) => item.classGrade === classGrade);
    return entry?.subjectsBySection?.[section] || [];
  };

  test('falls back to what other teachers of the same section teach', async () => {
    await asClassTeacher();
    await TeacherProfile.create({
      userId: new mongoose.Types.ObjectId(),
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [
        { class: 'PLAY GROUP', section: 'A', subjects: ['Rhymes', 'Drawing'] },
      ],
    });

    expect((await subjectsFor('PLAY GROUP', 'A')).sort()).toEqual(['Drawing', 'Rhymes']);
  });

  test("falls back to the school's subject catalogue when nobody teaches the section yet", async () => {
    await asClassTeacher();
    await Lookup.create([
      { type: 'subject', code: 'draw', label: 'Drawing', group: String(schoolId) },
      { type: 'subject', code: 'rhym', label: 'Rhymes', group: String(schoolId) },
    ]);

    expect((await subjectsFor('PLAY GROUP', 'A')).sort()).toEqual(['Drawing', 'Rhymes']);
  });

  test('catalogue duplicates under different codes are offered once', async () => {
    // createSubject only guarantees the code is unique, so the same label legitimately
    // exists several times over — the dropdown must not repeat it.
    await asClassTeacher();
    await Lookup.create([
      { type: 'subject', code: 'eng1', label: 'English', group: String(schoolId) },
      { type: 'subject', code: 'eng2', label: 'English', group: String(schoolId) },
    ]);

    expect(await subjectsFor('PLAY GROUP', 'A')).toEqual(['English']);
  });

  test('another school\'s catalogue is never offered', async () => {
    await asClassTeacher();
    const other = await School.create({
      code: 'CTS-002',
      name: 'Other School',
      schoolRefNo: 'CTS-REF-002',
    });
    await Lookup.create({
      type: 'subject',
      code: 'other',
      label: 'Somebody Elses Subject',
      group: String(other._id),
    });

    expect(await subjectsFor('PLAY GROUP', 'A')).toEqual([]);
  });

  test('inactive catalogue subjects are not offered', async () => {
    await asClassTeacher();
    await Lookup.create([
      { type: 'subject', code: 'act', label: 'Active', group: String(schoolId) },
      { type: 'subject', code: 'old', label: 'Retired', group: String(schoolId), status: 'inactive' },
    ]);

    expect(await subjectsFor('PLAY GROUP', 'A')).toEqual(['Active']);
  });

  test('a class teacher who does have their own subjects keeps exactly those', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [
        { class: 'PLAY GROUP', section: 'A', subjects: ['Rhymes'], isClassTeacher: true },
      ],
    });
    await Lookup.create({ type: 'subject', code: 'draw', label: 'Drawing', group: String(schoolId) });

    expect(await subjectsFor('PLAY GROUP', 'A')).toEqual(['Rhymes']);
  });

  test('a subject teacher who is not the class teacher gets no fallback', async () => {
    await TeacherProfile.create({
      userId: teacherUserId,
      schoolId,
      approvalStatus: 'approved',
      classAssignments: [
        { class: 'PLAY GROUP', section: 'A', subjects: [], isClassTeacher: false },
      ],
    });
    await Lookup.create({ type: 'subject', code: 'draw', label: 'Drawing', group: String(schoolId) });

    expect(await subjectsFor('PLAY GROUP', 'A')).toEqual([]);
  });
});
