const { Joi, schemas } = require('../../../common/validation');

const objectId = schemas.objectId;

const paginationQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().trim().optional(),
  fields: Joi.string().trim().optional(),
  search: Joi.string().trim().max(120).optional(),
});

const schoolIdParam = Joi.object({ schoolId: objectId.required() });
const courseIdParam = schoolIdParam.keys({ courseId: objectId.required() });
const chapterIdParam = courseIdParam.keys({ chapterId: objectId.required() });
const lessonIdParam = courseIdParam.keys({ lessonId: objectId.required() });
const assignmentIdParam = courseIdParam.keys({ assignmentId: objectId.required() });
const quizIdParam = courseIdParam.keys({ quizId: objectId.required() });
const submissionIdParam = assignmentIdParam.keys({ submissionId: objectId.required() });
const attemptIdParam = quizIdParam.keys({ attemptId: objectId.required() });
const commentIdParam = lessonIdParam.keys({ commentId: objectId.required() });
const noteIdParam = schoolIdParam.keys({ noteId: objectId.required() });
const certificateIdParam = schoolIdParam.keys({ certificateId: objectId.required() });

const createCourseSchema = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().max(5000).optional(),
  category: Joi.string().trim().optional(),
  subject: Joi.string().trim().optional(),
  gradeClass: Joi.string().trim().optional(),
  targetAudience: Joi.string().valid('parents', 'teachers', 'students', 'all').default('students'),
  instructorName: Joi.string().trim().optional(),
  instructorUserId: objectId.optional(),
  thumbnailId: objectId.optional(),
  thumbnailUrl: Joi.string().trim().max(2048).optional(),
  videoUrl: Joi.string().trim().max(2048).optional(),
  durationLabel: Joi.string().trim().max(40).optional(),
  tags: Joi.array().items(Joi.string().trim()).optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
});

const updateCourseSchema = createCourseSchema.fork(['title'], (s) => s.optional());

const courseStatusSchema = Joi.object({
  status: Joi.string().valid('draft', 'published', 'archived').required(),
});

const createChapterSchema = Joi.object({
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().max(3000).optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('draft', 'published').optional(),
});

const updateChapterSchema = createChapterSchema.fork(['title'], (s) => s.optional());

const reorderSchema = Joi.object({
  orderedIds: Joi.array().items(objectId).min(1).required(),
});

const createLessonSchema = Joi.object({
  chapterId: objectId.optional(),
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().max(5000).optional(),
  lessonType: Joi.string().valid('video', 'reading', 'quiz', 'assignment').default('video'),
  visibility: Joi.string().valid('visible', 'hidden').default('visible'),
  contentHtml: Joi.string().max(50000).optional(),
  videoId: objectId.optional(),
  durationSec: Joi.number().integer().min(0).optional(),
  resources: Joi.array().items(objectId).optional(),
  displayOrder: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid('draft', 'published').optional(),
});

const updateLessonSchema = createLessonSchema.fork(['title'], (s) => s.optional());

const createAssignmentSchema = Joi.object({
  chapterId: objectId.optional(),
  lessonId: objectId.optional(),
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().max(5000).optional(),
  instructions: Joi.string().trim().max(5000).optional(),
  dueDate: Joi.date().optional(),
  assignedDate: Joi.date().optional(),
  classGrade: Joi.string().trim().max(40).optional(),
  section: Joi.string().trim().max(20).optional(),
  homeworkType: Joi.string().valid('Written', 'Reading', 'Project', 'Online Quiz').optional(),
  priority: Joi.string().valid('High', 'Medium', 'Low').optional(),
  reference: Joi.object({
    textbook: Joi.string().trim().max(160).allow('').optional(),
    chapter: Joi.string().trim().max(160).allow('').optional(),
  }).optional(),
  maxScore: Joi.number().min(0).default(100),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
});

const updateAssignmentSchema = createAssignmentSchema.fork(['title'], (s) => s.optional());

const submitAssignmentSchema = Joi.object({
  content: Joi.string().trim().max(10000).allow('').optional(),
  attachments: Joi.array().items(objectId).optional(),
  // Base64 data URIs of the completed work (photos/PDF). Kept small and few because
  // they are inlined in the request body.
  files: Joi.array().items(Joi.string().max(8 * 1024 * 1024)).max(5).optional(),
  studentId: objectId.optional(),
});

const evaluateSubmissionSchema = Joi.object({
  score: Joi.number().min(0).required(),
  feedback: Joi.string().trim().max(3000).optional(),
});

const quizQuestionSchema = Joi.object({
  question: Joi.string().trim().required(),
  options: Joi.array().items(Joi.string().trim()).min(2).required(),
  correctIndex: Joi.number().integer().min(0).required(),
  points: Joi.number().min(0).default(1),
});

const createQuizSchema = Joi.object({
  lessonId: objectId.optional(),
  title: Joi.string().trim().min(2).max(160).required(),
  description: Joi.string().trim().max(3000).optional(),
  passingScorePercent: Joi.number().min(0).max(100).default(60),
  timeLimitMin: Joi.number().integer().min(1).optional(),
  maxAttempts: Joi.number().integer().min(1).default(1),
  questions: Joi.array().items(quizQuestionSchema).default([]),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
});

const updateQuizSchema = createQuizSchema.fork(['title'], (s) => s.optional());

const submitQuizSchema = Joi.object({
  answers: Joi.array()
    .items(
      Joi.object({
        questionId: objectId.required(),
        selectedIndex: Joi.number().integer().min(0).required(),
      })
    )
    .required(),
  studentId: objectId.optional(),
});

const lessonProgressSchema = Joi.object({
  progressPercent: Joi.number().min(0).max(100).required(),
  lastPositionSec: Joi.number().integer().min(0).default(0),
  studentId: objectId.optional(),
});

const enrollStudentSchema = Joi.object({
  studentId: objectId.required(),
  userId: objectId.required(),
});

const createNoteSchema = Joi.object({
  courseId: objectId.optional(),
  lessonId: objectId.optional(),
  title: Joi.string().trim().max(120).optional(),
  content: Joi.string().trim().min(1).max(10000).required(),
});

const updateNoteSchema = createNoteSchema.fork(['content'], (s) => s.optional());

const createCommentSchema = Joi.object({
  text: Joi.string().trim().min(1).max(1000).required(),
  parentCommentId: objectId.optional(),
});

const updateCommentSchema = Joi.object({
  text: Joi.string().trim().min(1).max(1000).required(),
});

const moderateCommentSchema = Joi.object({
  moderationStatus: Joi.string().valid('visible', 'hidden', 'flagged').required(),
});

const bookmarkSchema = Joi.object({
  courseId: objectId.required(),
  lessonId: objectId.optional(),
  lastPositionSec: Joi.number().integer().min(0).default(0),
});

const generateCertificateSchema = Joi.object({
  studentId: objectId.optional(),
});

const certificateQuerySchema = paginationQuery.keys({
  courseId: objectId.optional(),
  studentId: objectId.optional(),
});

const studentIdQuerySchema = Joi.object({
  studentId: objectId.optional(),
});

module.exports = {
  paginationQuery,
  schoolIdParam,
  courseIdParam,
  chapterIdParam,
  lessonIdParam,
  assignmentIdParam,
  quizIdParam,
  submissionIdParam,
  attemptIdParam,
  commentIdParam,
  noteIdParam,
  certificateIdParam,
  createCourseSchema,
  updateCourseSchema,
  courseStatusSchema,
  createChapterSchema,
  updateChapterSchema,
  reorderSchema,
  createLessonSchema,
  updateLessonSchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  submitAssignmentSchema,
  evaluateSubmissionSchema,
  createQuizSchema,
  updateQuizSchema,
  submitQuizSchema,
  lessonProgressSchema,
  enrollStudentSchema,
  createNoteSchema,
  updateNoteSchema,
  createCommentSchema,
  updateCommentSchema,
  moderateCommentSchema,
  bookmarkSchema,
  generateCertificateSchema,
  certificateQuerySchema,
  studentIdQuerySchema,
};
