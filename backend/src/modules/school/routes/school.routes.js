const express = require('express');
const { Joi } = require('../../../common/validation');
const schoolController = require('../controllers/school.controller');
const validators = require('../validators/school.validator');
const rfqValidators = require('../../rfq/validators/rfq.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { PERMISSIONS } = require('../../../constants/permissions');
const { ROLES } = require('../../../constants/roles');
const { resolveSchool } = require('../middlewares/resolveSchool');
const { uploadImage } = require('../../admin/middlewares/upload.middleware');

const router = express.Router();

const superAdminOnly = protectedRoute({ roles: [ROLES.SUPER_ADMIN], scopes: ['*'] });
const schoolAdmin = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN],
  permissions: [PERMISSIONS.SCHOOLS_READ],
  tenant: { requireTenantId: false },
});
const schoolWrite = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN],
  permissions: [PERMISSIONS.SCHOOLS_WRITE],
  tenant: { requireTenantId: false },
});
const teacherRead = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER],
  permissions: [PERMISSIONS.STUDENTS_READ],
  tenant: { requireTenantId: false },
});
const teacherWrite = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER],
  permissions: [PERMISSIONS.ATTENDANCE_WRITE],
  tenant: { requireTenantId: false },
});

router.get(
  '/',
  ...superAdminOnly,
  validateQuery(validators.paginationQuery),
  schoolController.listSchools
);
router.post('/', ...superAdminOnly, validateBody(validators.createSchoolSchema), schoolController.createSchool);

router.get(
  '/:schoolId',
  ...schoolAdmin,
  resolveSchool(),
  schoolController.getSchool
);
router.patch(
  '/:schoolId',
  ...schoolWrite,
  resolveSchool(),
  validateBody(validators.updateSchoolSchema),
  schoolController.updateSchool
);
router.delete(
  '/:schoolId',
  ...superAdminOnly,
  resolveSchool(),
  schoolController.deleteSchool
);

router.post(
  '/:schoolId/teachers',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TEACHERS_WRITE] }),
  resolveSchool(),
  validateBody(validators.createTeacherSchema),
  schoolController.createTeacher
);
router.get(
  '/:schoolId/teachers/me',
  ...protectedRoute({ roles: [ROLES.TEACHER], permissions: [PERMISSIONS.CLASSES_READ] }),
  resolveSchool(),
  schoolController.getMyTeacherProfile
);
router.get(
  '/:schoolId/teachers',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TEACHERS_READ] }),
  resolveSchool(),
  validateQuery(validators.paginationQuery),
  schoolController.listTeachers
);
router.get(
  '/:schoolId/teachers/:teacherId',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TEACHERS_READ] }),
  resolveSchool(),
  validateParams(validators.teacherIdParam),
  schoolController.getTeacher
);
router.patch(
  '/:schoolId/teachers/:teacherId',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TEACHERS_WRITE] }),
  resolveSchool(),
  validateParams(validators.teacherIdParam),
  validateBody(validators.updateTeacherSchema),
  schoolController.updateTeacher
);
router.patch(
  '/:schoolId/teachers/:teacherId/status',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TEACHERS_WRITE] }),
  resolveSchool(),
  validateParams(validators.teacherIdParam),
  validateBody(validators.teacherStatusSchema),
  schoolController.setTeacherStatus
);

router.delete(
  '/:schoolId/teachers/:teacherId',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TEACHERS_WRITE] }),
  resolveSchool(),
  validateParams(validators.teacherIdParam),
  schoolController.deleteTeacher
);

router.get(
  '/:schoolId/classes',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.CLASSES_READ] }),
  resolveSchool(),
  schoolController.listClasses
);
router.post(
  '/:schoolId/classes',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateBody(validators.createClassSchema),
  schoolController.createClass
);
router.patch(
  '/:schoolId/classes/:classGrade',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.classGradeParam),
  validateBody(validators.updateClassSchema),
  schoolController.updateClass
);
router.delete(
  '/:schoolId/classes/:classGrade',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.classGradeParam),
  schoolController.deleteClass
);
// Teacher ↔ class/section/subject assignments (Class & Teacher Assignments page)
router.get(
  '/:schoolId/teacher-assignments',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_READ] }),
  resolveSchool(),
  schoolController.listTeacherAssignments
);
router.put(
  '/:schoolId/teachers/:teacherId/assignments',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.teacherIdParam),
  validateBody(validators.upsertAssignmentSchema),
  schoolController.upsertTeacherAssignment
);
router.delete(
  '/:schoolId/teachers/:teacherId/assignments',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.teacherIdParam),
  validateQuery(validators.removeAssignmentQuerySchema),
  schoolController.removeTeacherAssignment
);

router.get(
  '/:schoolId/classes/:classGrade/sections',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.CLASSES_READ] }),
  resolveSchool(),
  validateParams(validators.classGradeParam),
  schoolController.listSections
);
router.post(
  '/:schoolId/classes/:classGrade/sections',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.classGradeParam),
  validateBody(validators.createSectionSchema),
  schoolController.createSection
);
router.patch(
  '/:schoolId/classes/:classGrade/sections/:section',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.sectionParam),
  validateBody(validators.updateSectionSchema),
  schoolController.updateSection
);
router.delete(
  '/:schoolId/classes/:classGrade/sections/:section',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.sectionParam),
  schoolController.deleteSection
);
router.post(
  '/:schoolId/classes/:classGrade/sections/:section/students',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.STUDENTS_WRITE] }),
  resolveSchool(),
  validateParams(validators.sectionParam),
  validateBody(validators.assignStudentsSchema),
  schoolController.assignStudentsToSection
);

// Enrollment is a school-admin action; teachers can view and edit students
// but must not create them
router.post(
  '/:schoolId/students',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.STUDENTS_WRITE] }),
  resolveSchool(),
  validateBody(validators.createStudentSchema),
  schoolController.registerStudent
);
router.get(
  '/:schoolId/students',
  ...teacherRead,
  resolveSchool(),
  validateQuery(validators.paginationQuery),
  schoolController.listStudents
);
router.get(
  '/:schoolId/students/:studentId',
  ...teacherRead,
  resolveSchool(),
  validateParams(validators.studentIdParam),
  schoolController.getStudent
);
router.patch(
  '/:schoolId/students/:studentId',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.STUDENTS_WRITE] }),
  resolveSchool(),
  validateParams(validators.studentIdParam),
  validateBody(validators.updateStudentSchema),
  schoolController.updateStudent
);
router.post(
  '/:schoolId/students/:studentId/transfer',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.STUDENTS_WRITE] }),
  resolveSchool(),
  validateParams(validators.studentIdParam),
  validateBody(validators.transferStudentSchema),
  schoolController.transferStudent
);
router.patch(
  '/:schoolId/students/:studentId/status',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.STUDENTS_WRITE] }),
  resolveSchool(),
  validateParams(validators.studentIdParam),
  validateBody(validators.studentStatusSchema),
  schoolController.updateStudentStatus
);
router.delete(
  '/:schoolId/students/:studentId',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.STUDENTS_WRITE] }),
  resolveSchool(),
  validateParams(validators.studentIdParam),
  schoolController.deleteStudent
);

router.get(
  '/:schoolId/subjects',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.CLASSES_READ] }),
  resolveSchool(),
  validateQuery(validators.paginationQuery),
  schoolController.listSubjects
);
router.post(
  '/:schoolId/subjects',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateBody(validators.subjectSchema),
  schoolController.createSubject
);
router.patch(
  '/:schoolId/subjects/:code',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.subjectCodeParam),
  validateBody(validators.updateSubjectSchema),
  schoolController.updateSubject
);
router.delete(
  '/:schoolId/subjects/:code',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateParams(validators.subjectCodeParam),
  schoolController.deleteSubject
);
router.post(
  '/:schoolId/subjects/assign',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.CLASSES_WRITE] }),
  resolveSchool(),
  validateBody(validators.assignSubjectSchema),
  schoolController.assignSubject
);

router.post(
  '/:schoolId/attendance',
  ...teacherWrite,
  resolveSchool(),
  validateBody(validators.markAttendanceSchema),
  schoolController.markAttendance
);
router.patch(
  '/:schoolId/attendance/:attendanceId',
  ...teacherWrite,
  resolveSchool(),
  validateParams(validators.attendanceIdParam),
  validateBody(validators.updateAttendanceSchema),
  schoolController.updateAttendance
);
router.get(
  '/:schoolId/attendance/daily',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.ATTENDANCE_READ] }),
  resolveSchool(),
  validateQuery(
    Joi.object({
      date: Joi.date().required(),
      classGrade: Joi.string().trim().optional(),
      section: Joi.string().trim().optional(),
    })
  ),
  schoolController.getDailyAttendance
);
router.get(
  '/:schoolId/attendance/history',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT], permissions: [PERMISSIONS.ATTENDANCE_READ] }),
  resolveSchool(),
  validateQuery(validators.attendanceQuerySchema),
  schoolController.getAttendanceHistory
);
router.get(
  '/:schoolId/attendance/summary/monthly',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.ATTENDANCE_READ] }),
  resolveSchool(),
  validateQuery(validators.monthlyAttendanceQuerySchema),
  schoolController.getMonthlyAttendanceSummary
);

router.post(
  '/:schoolId/timetable',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TIMETABLE_WRITE] }),
  resolveSchool(),
  validateBody(validators.timetableSlotSchema),
  schoolController.createTimetableSlot
);
router.get(
  '/:schoolId/timetable',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.TIMETABLE_READ] }),
  resolveSchool(),
  validateQuery(validators.timetableQuerySchema),
  schoolController.listTimetable
);
router.get(
  '/:schoolId/timetable/class',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.TIMETABLE_READ] }),
  resolveSchool(),
  validateQuery(validators.timetableQuerySchema),
  schoolController.getClassTimetable
);
router.get(
  '/:schoolId/timetable/teacher',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER], permissions: [PERMISSIONS.TIMETABLE_READ] }),
  resolveSchool(),
  validateQuery(validators.timetableQuerySchema),
  schoolController.getTeacherTimetable
);
router.patch(
  '/:schoolId/timetable/:slotId',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TIMETABLE_WRITE] }),
  resolveSchool(),
  validateParams(validators.slotIdParam),
  validateBody(
    validators.timetableSlotSchema.fork(
      [
        'academicYear',
        'classGrade',
        'section',
        'dayOfWeek',
        'periodNumber',
        'startTime',
        'endTime',
        'subjectCode',
        'teacherProfileId',
        'room',
      ],
      (schema) => schema.optional()
    )
  ),
  schoolController.updateTimetableSlot
);
router.delete(
  '/:schoolId/timetable/:slotId',
  ...protectedRoute({ roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN], permissions: [PERMISSIONS.TIMETABLE_WRITE] }),
  resolveSchool(),
  validateParams(validators.slotIdParam),
  schoolController.deleteTimetableSlot
);

const noticeRead = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT],
  permissions: [PERMISSIONS.NOTICES_READ],
  tenant: { requireTenantId: false },
});
const noticeWrite = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN],
  permissions: [PERMISSIONS.NOTICES_SEND],
  tenant: { requireTenantId: false },
});
const diaryRead = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER, ROLES.PARENT],
  permissions: [PERMISSIONS.DIARY_READ],
  tenant: { requireTenantId: false },
});
const diaryWrite = protectedRoute({
  roles: [ROLES.SUPER_ADMIN, ROLES.SCHOOL_ADMIN, ROLES.TEACHER],
  permissions: [PERMISSIONS.DIARY_WRITE],
  tenant: { requireTenantId: false },
});

router.post(
  '/:schoolId/notices',
  ...noticeWrite,
  resolveSchool(),
  validateBody(validators.createNoticeSchema),
  schoolController.createNotice
);
router.get(
  '/:schoolId/notices',
  ...noticeRead,
  resolveSchool(),
  validateQuery(validators.noticeQuerySchema),
  schoolController.listNotices
);
router.get(
  '/:schoolId/notices/:noticeId',
  ...noticeRead,
  resolveSchool(),
  validateParams(validators.noticeIdParam),
  validateQuery(validators.studentIdQuerySchema),
  schoolController.getNotice
);
// Parents acknowledge a notice they can see; noticeRead (not noticeWrite) is
// correct here — it is the parent's own read receipt, not an edit to the notice.
router.post(
  '/:schoolId/notices/:noticeId/acknowledge',
  ...noticeRead,
  resolveSchool(),
  validateParams(validators.noticeIdParam),
  validateQuery(validators.studentIdQuerySchema),
  schoolController.acknowledgeNotice
);
router.patch(
  '/:schoolId/notices/:noticeId',
  ...noticeWrite,
  resolveSchool(),
  validateParams(validators.noticeIdParam),
  validateBody(validators.updateNoticeSchema),
  schoolController.updateNotice
);
router.patch(
  '/:schoolId/notices/:noticeId/status',
  ...noticeWrite,
  resolveSchool(),
  validateParams(validators.noticeIdParam),
  validateBody(validators.noticeStatusSchema),
  schoolController.setNoticeStatus
);
router.delete(
  '/:schoolId/notices/:noticeId',
  ...noticeWrite,
  resolveSchool(),
  validateParams(validators.noticeIdParam),
  schoolController.deleteNotice
);

router.post(
  '/:schoolId/uploads',
  ...schoolAdmin,
  resolveSchool(),
  uploadImage,
  schoolController.uploadAttachment
);

router.post(
  '/:schoolId/diary',
  ...diaryWrite,
  resolveSchool(),
  validateBody(validators.createDiarySchema),
  schoolController.createDiaryEntry
);
router.get(
  '/:schoolId/diary',
  ...diaryRead,
  resolveSchool(),
  validateQuery(validators.diaryQuerySchema),
  schoolController.listDiaryEntries
);
router.get(
  '/:schoolId/diary/:entryId',
  ...diaryRead,
  resolveSchool(),
  validateParams(validators.diaryIdParam),
  validateQuery(validators.studentIdQuerySchema),
  schoolController.getDiaryEntry
);
router.patch(
  '/:schoolId/diary/:entryId/read',
  ...protectedRoute({ roles: [ROLES.PARENT], permissions: [PERMISSIONS.DIARY_READ], tenant: { requireTenantId: false } }),
  resolveSchool(),
  validateParams(validators.diaryIdParam),
  validateQuery(validators.studentIdQuerySchema),
  schoolController.markDiaryRead
);
router.patch(
  '/:schoolId/diary/:entryId',
  ...diaryWrite,
  resolveSchool(),
  validateParams(validators.diaryIdParam),
  validateBody(validators.updateDiarySchema),
  schoolController.updateDiaryEntry
);
router.delete(
  '/:schoolId/diary/:entryId',
  ...diaryWrite,
  resolveSchool(),
  validateParams(validators.diaryIdParam),
  schoolController.deleteDiaryEntry
);

router.get(
  '/:schoolId/vendors',
  ...schoolAdmin,
  resolveSchool(),
  validateQuery(validators.paginationQuery),
  schoolController.listVendors
);

router.post(
  '/:schoolId/rfqs',
  ...schoolAdmin,
  resolveSchool(),
  validateBody(rfqValidators.createRfqSchema),
  schoolController.createRfq
);

router.get(
  '/:schoolId/rfqs',
  ...schoolAdmin,
  resolveSchool(),
  validateQuery(rfqValidators.paginationQuery),
  schoolController.listRfqs
);

router.get(
  '/:schoolId/rfqs/:rfqId',
  ...schoolAdmin,
  resolveSchool(),
  validateParams(rfqValidators.rfqIdParam),
  schoolController.getRfq
);

router.patch(
  '/:schoolId/rfqs/:rfqId',
  ...schoolAdmin,
  resolveSchool(),
  validateParams(rfqValidators.rfqIdParam),
  validateBody(rfqValidators.updateRfqSchema),
  schoolController.updateRfq
);

// Drafts only — the service refuses anything already open to vendors
router.delete(
  '/:schoolId/rfqs/:rfqId',
  ...schoolAdmin,
  resolveSchool(),
  validateParams(rfqValidators.rfqIdParam),
  schoolController.deleteRfq
);

router.post(
  '/:schoolId/rfqs/:rfqId/quotes/:quoteId/award',
  ...schoolAdmin,
  resolveSchool(),
  validateParams(rfqValidators.quoteIdParam),
  schoolController.awardRfqQuote
);

// Parents Management (view-only: parent accounts are created automatically
// when a student is enrolled with parent details)
router.get(
  '/:schoolId/parents',
  ...schoolAdmin,
  resolveSchool(),
  validateQuery(validators.paginationQuery),
  schoolController.listParents
);

router.get(
  '/:schoolId/parents/:parentId',
  ...schoolAdmin,
  resolveSchool(),
  validateParams(validators.parentIdParam),
  schoolController.getParent
);

router.patch(
  '/:schoolId/parents/:parentId',
  ...schoolAdmin,
  resolveSchool(),
  validateParams(validators.parentIdParam),
  validateBody(validators.updateParentSchema),
  schoolController.updateParent
);

router.delete(
  '/:schoolId/parents/:parentId',
  ...schoolAdmin,
  resolveSchool(),
  validateParams(validators.parentIdParam),
  schoolController.deleteParent
);

// Re-send the account-created email. Declared before the :parentId variant so the
// literal "resend-welcome" segment is not swallowed by the param route.
router.post(
  '/:schoolId/parents/resend-welcome',
  ...schoolAdmin,
  resolveSchool(),
  validateBody(validators.resendParentWelcomeSchema),
  schoolController.resendParentWelcomeBulk
);

router.post(
  '/:schoolId/parents/:parentId/resend-welcome',
  ...schoolAdmin,
  resolveSchool(),
  validateParams(validators.parentIdParam),
  schoolController.resendParentWelcome
);

module.exports = router;
