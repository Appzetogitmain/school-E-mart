const mongoose = require('mongoose');
const quizService = require('../../src/modules/lms/services/quiz.service');
const courseService = require('../../src/modules/lms/services/course.service');
const progressService = require('../../src/modules/lms/services/progress.service');
const School = require('../../src/database/models/School');
const Student = require('../../src/database/models/Student');
const ChildProfile = require('../../src/database/models/ChildProfile');

describe('quizService', () => {
  let schoolId;
  let courseId;
  let studentId;
  let userId;
  let quizId;

  beforeEach(async () => {
    const school = await School.create({
      code: 'QZ-001',
      name: 'Quiz School',
      schoolRefNo: 'QZ-REF-001',
    });
    schoolId = school._id;
    userId = new mongoose.Types.ObjectId();

    const course = await courseService.createCourse(schoolId, {
      title: 'Science Basics',
      targetAudience: 'students',
      status: 'published',
    });
    courseId = course._id;

    const student = await Student.create({
      schoolId,
      name: 'Asha',
      schoolRefNo: 'STU-QZ-001',
      classGrade: 'Class 5',
      section: 'A',
    });
    studentId = student._id;

    await ChildProfile.create({
      parentUserId: userId,
      name: 'Asha',
      grade: 'Class 5',
      schoolId,
      studentId,
    });

    await progressService.enrollStudent(schoolId, courseId, { studentId, userId });

    const quiz = await quizService.createQuiz(schoolId, courseId, {
      title: 'Chapter Quiz',
      passingScorePercent: 50,
      maxAttempts: 1,
      status: 'published',
      questions: [
        {
          question: '2 + 2 = ?',
          options: ['3', '4', '5'],
          correctIndex: 1,
          points: 1,
        },
      ],
    });
    quizId = quiz._id;
  });

  test('scores quiz attempts and prevents duplicate max attempts', async () => {
    const req = {
      lmsStudent: { _id: studentId },
      lmsUserId: userId,
      auth: { userId, role: 'parent' },
    };

    const attempt = await quizService.startAttempt(req, schoolId, courseId, quizId);
    const questionId = attempt._id && (await quizService.getQuiz(schoolId, courseId, quizId)).questions[0]._id;

    const quiz = await quizService.getQuiz(schoolId, courseId, quizId);
    const submitted = await quizService.submitAttempt(
      req,
      schoolId,
      courseId,
      quizId,
      attempt._id,
      [{ questionId: quiz.questions[0]._id, selectedIndex: 1 }]
    );

    expect(submitted.status).toBe('completed');
    expect(submitted.scorePercent).toBe(100);
    expect(submitted.passed).toBe(true);

    await expect(quizService.startAttempt(req, schoolId, courseId, quizId)).rejects.toMatchObject({
      code: 'QUIZ_ATTEMPTS_EXCEEDED',
    });
  });
});
