const schoolService = require('../../src/modules/school/services/school.service');
const classService = require('../../src/modules/school/services/class.service');

describe('schoolService', () => {
  test('creates, lists, updates, and soft deletes a school', async () => {
    const created = await schoolService.createSchool({
      name: 'Green Valley School',
      schoolRefNo: 'GV-2026-001',
      partnerStatus: 'active',
    });

    expect(created.name).toBe('Green Valley School');
    expect(created.code).toBeTruthy();

    const listed = await schoolService.listSchools({ page: 1, limit: 10 });
    expect(listed.data.length).toBe(1);

    const updated = await schoolService.updateSchool(created._id, {
      principalName: 'Dr. Mehta',
    });
    expect(updated.principalName).toBe('Dr. Mehta');

    const deleted = await schoolService.deleteSchool(created._id, created._id);
    expect(deleted.softDelete.isDeleted).toBe(true);

    await expect(schoolService.getSchool(created._id)).rejects.toMatchObject({
      code: 'SCHOOL_NOT_FOUND',
    });
  });

  test('manages classes through school sectionsConfig', async () => {
    const school = await schoolService.createSchool({
      name: 'Class Test School',
      schoolRefNo: 'CLS-001',
    });

    await classService.createClass(school._id, {
      classGrade: 'Class 1',
      sections: ['A', 'B'],
    });

    const classes = await classService.listClasses(school._id);
    expect(classes).toHaveLength(1);
    expect(classes[0].sections).toEqual(expect.arrayContaining(['A', 'B']));
  });
});
