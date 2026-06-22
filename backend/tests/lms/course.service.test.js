const mongoose = require('mongoose');
const courseService = require('../../src/modules/lms/services/course.service');
const School = require('../../src/database/models/School');

describe('courseService', () => {
  let schoolId;

  beforeEach(async () => {
    const school = await School.create({
      code: 'LMS-001',
      name: 'LMS Test School',
      schoolRefNo: 'LMS-REF-001',
    });
    schoolId = school._id;
  });

  test('creates, lists, updates, publishes, and soft deletes a course', async () => {
    const created = await courseService.createCourse(schoolId, {
      title: 'Mathematics Foundations',
      subject: 'Mathematics',
      gradeClass: 'Class 5',
      targetAudience: 'students',
    });

    expect(created.title).toBe('Mathematics Foundations');
    expect(created.slug).toBeTruthy();
    expect(String(created.schoolId)).toBe(String(schoolId));

    const listed = await courseService.listCourses(schoolId, { page: 1, limit: 10 });
    expect(listed.data).toHaveLength(1);

    const updated = await courseService.updateCourse(schoolId, created._id, {
      description: 'Introductory math course',
    });
    expect(updated.description).toBe('Introductory math course');

    const published = await courseService.setCourseStatus(schoolId, created._id, 'published');
    expect(published.status).toBe('published');

    const deleted = await courseService.deleteCourse(schoolId, created._id, new mongoose.Types.ObjectId());
    expect(deleted.softDelete.isDeleted).toBe(true);
  });
});
