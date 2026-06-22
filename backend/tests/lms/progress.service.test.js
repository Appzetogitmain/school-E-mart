const mongoose = require('mongoose');
const courseService = require('../../src/modules/lms/services/course.service');
const chapterService = require('../../src/modules/lms/services/chapter.service');
const lessonService = require('../../src/modules/lms/services/lesson.service');
const progressService = require('../../src/modules/lms/services/progress.service');
const School = require('../../src/database/models/School');
const Student = require('../../src/database/models/Student');
const ChildProfile = require('../../src/database/models/ChildProfile');

describe('progressService', () => {
  let schoolId;
  let courseId;
  let studentId;
  let userId;
  let lessonId;

  beforeEach(async () => {
    const school = await School.create({
      code: 'PRG-001',
      name: 'Progress School',
      schoolRefNo: 'PRG-REF-001',
    });
    schoolId = school._id;
    userId = new mongoose.Types.ObjectId();

    const course = await courseService.createCourse(schoolId, {
      title: 'English Course',
      targetAudience: 'students',
      status: 'published',
    });
    courseId = course._id;

    const chapter = await chapterService.createChapter(schoolId, courseId, {
      title: 'Chapter 1',
      status: 'published',
    });

    const lesson = await lessonService.createLesson(schoolId, courseId, {
      chapterId: chapter._id,
      title: 'Lesson 1',
      status: 'published',
      visibility: 'visible',
    });
    lessonId = lesson._id;

    const student = await Student.create({
      schoolId,
      name: 'Ravi',
      schoolRefNo: 'STU-PRG-001',
      classGrade: 'Class 4',
      section: 'B',
    });
    studentId = student._id;

    await ChildProfile.create({
      parentUserId: userId,
      name: 'Ravi',
      grade: 'Class 4',
      schoolId,
      studentId,
    });

    await progressService.enrollStudent(schoolId, courseId, { studentId, userId });
  });

  test('tracks lesson and course completion percentage', async () => {
    await progressService.updateLessonProgress(userId, schoolId, courseId, lessonId, {
      progressPercent: 100,
      lastPositionSec: 120,
    }, studentId);

    const progress = await progressService.getCourseProgress(userId, courseId);
    expect(progress.totalLessons).toBe(1);
    expect(progress.completedLessons).toBe(1);
    expect(progress.completionPercent).toBe(100);
    expect(progress.chapters[0].percent).toBe(100);
  });
});
