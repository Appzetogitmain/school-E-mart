const { success, created, paginated } = require('../../../common/response');
const asyncHandler = require('../../../utils/asyncHandler');
const schoolService = require('../services/school.service');
const teacherService = require('../services/teacher.service');
const classService = require('../services/class.service');
const sectionService = require('../services/section.service');
const studentService = require('../services/student.service');
const subjectService = require('../services/subject.service');
const attendanceService = require('../services/attendance.service');
const timetableService = require('../services/timetable.service');
const noticeService = require('../services/notice.service');
const diaryService = require('../services/diary.service');
const vendorDirectoryService = require('../services/vendorDirectory.service');
const rfqService = require('../../rfq/services/rfq.service');
const parentService = require('../services/parent.service');
const attachmentService = require('../../admin/services/attachment.service');

const schoolController = {
  createSchool: asyncHandler(async (req, res) => {
    const school = await schoolService.createSchool(req.body);
    return created(res, { school }, 'School created successfully', req);
  }),

  listSchools: asyncHandler(async (req, res) => {
    const { data, pagination } = await schoolService.listSchools(req.query);
    return paginated(res, { schools: data }, pagination, 'Schools fetched successfully', req);
  }),

  getSchool: asyncHandler(async (req, res) => {
    const school = await schoolService.getSchool(req.schoolId);
    return success(res, { school }, 'School fetched successfully', undefined, req);
  }),

  updateSchool: asyncHandler(async (req, res) => {
    const school = await schoolService.updateSchool(req.schoolId, req.body);
    return success(res, { school }, 'School updated successfully', undefined, req);
  }),

  deleteSchool: asyncHandler(async (req, res) => {
    await schoolService.deleteSchool(req.schoolId, req.auth.userId);
    return success(res, null, 'School deleted successfully', undefined, req);
  }),

  createTeacher: asyncHandler(async (req, res) => {
    const result = await teacherService.createTeacher(req.schoolId, req.body);
    return created(res, result, 'Teacher created successfully', req);
  }),

  listTeachers: asyncHandler(async (req, res) => {
    const { data, pagination } = await teacherService.listTeachers(req.schoolId, req.query, {
      approvalStatus: req.query.approvalStatus,
    });
    return paginated(res, { teachers: data }, pagination, 'Teachers fetched successfully', req);
  }),

  getMyTeacherProfile: asyncHandler(async (req, res) => {
    const teacher = await teacherService.getTeacherByUserId(req.schoolId, req.auth.userId);
    return success(res, { teacher }, 'Teacher profile fetched successfully', undefined, req);
  }),

  getTeacher: asyncHandler(async (req, res) => {
    const teacher = await teacherService.getTeacher(req.schoolId, req.params.teacherId);
    return success(res, { teacher }, 'Teacher fetched successfully', undefined, req);
  }),

  updateTeacher: asyncHandler(async (req, res) => {
    const teacher = await teacherService.updateTeacher(req.schoolId, req.params.teacherId, req.body);
    return success(res, { teacher }, 'Teacher updated successfully', undefined, req);
  }),

  setTeacherStatus: asyncHandler(async (req, res) => {
    const teacher = await teacherService.setTeacherStatus(req.schoolId, req.params.teacherId, {
      ...req.body,
      approvedBy: req.auth.userId,
    });
    return success(res, { teacher }, 'Teacher status updated successfully', undefined, req);
  }),

  deleteTeacher: asyncHandler(async (req, res) => {
    await teacherService.deleteTeacher(req.schoolId, req.params.teacherId);
    return success(res, null, 'Teacher deleted successfully', undefined, req);
  }),

  listClasses: asyncHandler(async (req, res) => {
    const classes = await classService.listClasses(req.schoolId, {
      userId: req.auth.role === 'teacher' ? req.auth.userId : undefined,
    });
    return success(res, { classes }, 'Classes fetched successfully', undefined, req);
  }),

  createClass: asyncHandler(async (req, res) => {
    const school = await classService.createClass(req.schoolId, req.body);
    return created(res, { school }, 'Class created successfully', req);
  }),

  updateClass: asyncHandler(async (req, res) => {
    const school = await classService.updateClass(req.schoolId, req.params.classGrade, req.body);
    return success(res, { school }, 'Class updated successfully', undefined, req);
  }),

  deleteClass: asyncHandler(async (req, res) => {
    const school = await classService.deleteClass(req.schoolId, req.params.classGrade);
    return success(res, { school }, 'Class deleted successfully', undefined, req);
  }),

  assignClassTeacher: asyncHandler(async (req, res) => {
    const result = await classService.assignClassTeacher(
      req.schoolId,
      req.params.classGrade,
      req.body.section,
      req.body.teacherProfileId
    );
    return success(res, result, 'Class teacher assigned successfully', undefined, req);
  }),

  listSections: asyncHandler(async (req, res) => {
    const sections = await sectionService.listSections(req.schoolId, req.params.classGrade);
    return success(res, sections, 'Sections fetched successfully', undefined, req);
  }),

  createSection: asyncHandler(async (req, res) => {
    const school = await sectionService.createSection(
      req.schoolId,
      req.params.classGrade,
      req.body.section
    );
    return created(res, { school }, 'Section created successfully', req);
  }),

  updateSection: asyncHandler(async (req, res) => {
    const school = await sectionService.updateSection(
      req.schoolId,
      req.params.classGrade,
      req.params.section,
      req.body.newSection
    );
    return success(res, { school }, 'Section updated successfully', undefined, req);
  }),

  deleteSection: asyncHandler(async (req, res) => {
    const school = await sectionService.deleteSection(
      req.schoolId,
      req.params.classGrade,
      req.params.section
    );
    return success(res, { school }, 'Section deleted successfully', undefined, req);
  }),

  assignStudentsToSection: asyncHandler(async (req, res) => {
    const students = await sectionService.assignStudents(
      req.schoolId,
      req.params.classGrade,
      req.params.section,
      req.body.studentIds
    );
    return success(res, { students }, 'Students assigned successfully', undefined, req);
  }),

  registerStudent: asyncHandler(async (req, res) => {
    const student = await studentService.registerStudent(req.schoolId, req.body);
    return created(res, { student }, 'Student registered successfully', req);
  }),

  listStudents: asyncHandler(async (req, res) => {
    const { data, pagination } = await studentService.listStudents(req.schoolId, req.query);
    return paginated(res, { students: data }, pagination, 'Students fetched successfully', req);
  }),

  getStudent: asyncHandler(async (req, res) => {
    const student = await studentService.getStudent(req.schoolId, req.params.studentId);
    return success(res, { student }, 'Student fetched successfully', undefined, req);
  }),

  updateStudent: asyncHandler(async (req, res) => {
    const student = await studentService.updateStudent(req.schoolId, req.params.studentId, req.body);
    return success(res, { student }, 'Student updated successfully', undefined, req);
  }),

  transferStudent: asyncHandler(async (req, res) => {
    const student = await studentService.transferStudent(req.schoolId, req.params.studentId, req.body);
    return success(res, { student }, 'Student transferred successfully', undefined, req);
  }),

  updateStudentStatus: asyncHandler(async (req, res) => {
    const student = await studentService.updateStudentStatus(
      req.schoolId,
      req.params.studentId,
      req.body.status
    );
    return success(res, { student }, 'Student status updated successfully', undefined, req);
  }),

  deleteStudent: asyncHandler(async (req, res) => {
    await studentService.deleteStudent(req.schoolId, req.params.studentId, req.auth.userId);
    return success(res, null, 'Student deleted successfully', undefined, req);
  }),

  listSubjects: asyncHandler(async (req, res) => {
    const { data, pagination } = await subjectService.listSubjects(req.schoolId, req.query);
    return paginated(res, { subjects: data }, pagination, 'Subjects fetched successfully', req);
  }),

  createSubject: asyncHandler(async (req, res) => {
    const subject = await subjectService.createSubject(req.schoolId, req.body);
    return created(res, { subject }, 'Subject created successfully', req);
  }),

  updateSubject: asyncHandler(async (req, res) => {
    const subject = await subjectService.updateSubject(req.schoolId, req.params.code, req.body);
    return success(res, { subject }, 'Subject updated successfully', undefined, req);
  }),

  deleteSubject: asyncHandler(async (req, res) => {
    const subject = await subjectService.deleteSubject(req.schoolId, req.params.code);
    return success(res, { subject }, 'Subject deleted successfully', undefined, req);
  }),

  assignSubject: asyncHandler(async (req, res) => {
    const result = await subjectService.assignSubjectToClass(req.schoolId, req.body);
    return success(res, result, 'Subject assigned successfully', undefined, req);
  }),

  markAttendance: asyncHandler(async (req, res) => {
    const records = await attendanceService.markAttendance(req, req.body);
    return success(res, { records }, 'Attendance marked successfully', undefined, req);
  }),

  updateAttendance: asyncHandler(async (req, res) => {
    const record = await attendanceService.updateAttendance(
      req.schoolId,
      req.params.attendanceId,
      req.body,
      req.auth.userId
    );
    return success(res, { record }, 'Attendance updated successfully', undefined, req);
  }),

  getDailyAttendance: asyncHandler(async (req, res) => {
    const data = await attendanceService.getDailyAttendance(req.schoolId, req.query);
    return success(res, { attendance: data }, 'Daily attendance fetched successfully', undefined, req);
  }),

  getAttendanceHistory: asyncHandler(async (req, res) => {
    const { data, pagination } = await attendanceService.getAttendanceHistory(req.schoolId, req.query);
    return paginated(res, { records: data }, pagination, 'Attendance history fetched successfully', req);
  }),

  getMonthlyAttendanceSummary: asyncHandler(async (req, res) => {
    const summary = await attendanceService.getMonthlySummary(req.schoolId, req.query);
    return success(res, { summary }, 'Monthly attendance summary fetched successfully', undefined, req);
  }),

  createTimetableSlot: asyncHandler(async (req, res) => {
    const slot = await timetableService.createSlot(req.schoolId, req.body);
    return created(res, { slot }, 'Timetable slot created successfully', req);
  }),

  listTimetable: asyncHandler(async (req, res) => {
    const { data, pagination } = await timetableService.listTimetable(req.schoolId, req.query);
    return paginated(res, { slots: data }, pagination, 'Timetable fetched successfully', req);
  }),

  getClassTimetable: asyncHandler(async (req, res) => {
    const slots = await timetableService.getClassTimetable(req.schoolId, req.query);
    return success(res, { slots }, 'Class timetable fetched successfully', undefined, req);
  }),

  getTeacherTimetable: asyncHandler(async (req, res) => {
    const slots = await timetableService.getTeacherTimetable(req.schoolId, req.query);
    return success(res, { slots }, 'Teacher timetable fetched successfully', undefined, req);
  }),

  updateTimetableSlot: asyncHandler(async (req, res) => {
    const slot = await timetableService.updateSlot(req.schoolId, req.params.slotId, req.body);
    return success(res, { slot }, 'Timetable slot updated successfully', undefined, req);
  }),

  deleteTimetableSlot: asyncHandler(async (req, res) => {
    await timetableService.deleteSlot(req.schoolId, req.params.slotId, req.auth.userId);
    return success(res, null, 'Timetable slot deleted successfully', undefined, req);
  }),

  createNotice: asyncHandler(async (req, res) => {
    const notice = await noticeService.createNotice(req.schoolId, req.body);
    return created(res, { notice }, 'Notice created successfully', req);
  }),

  listNotices: asyncHandler(async (req, res) => {
    const { data, pagination } = await noticeService.listNotices(req, req.schoolId, req.query);
    return paginated(res, { notices: data }, pagination, 'Notices fetched successfully', req);
  }),

  getNotice: asyncHandler(async (req, res) => {
    const notice = await noticeService.getNotice(req, req.schoolId, req.params.noticeId);
    return success(res, { notice }, 'Notice fetched successfully', undefined, req);
  }),

  updateNotice: asyncHandler(async (req, res) => {
    const notice = await noticeService.updateNotice(req.schoolId, req.params.noticeId, req.body);
    return success(res, { notice }, 'Notice updated successfully', undefined, req);
  }),

  setNoticeStatus: asyncHandler(async (req, res) => {
    const notice = await noticeService.setNoticeStatus(req.schoolId, req.params.noticeId, req.body.status);
    return success(res, { notice }, 'Notice status updated successfully', undefined, req);
  }),

  deleteNotice: asyncHandler(async (req, res) => {
    await noticeService.deleteNotice(req.schoolId, req.params.noticeId, req.auth.userId);
    return success(res, null, 'Notice deleted successfully', undefined, req);
  }),

  createDiaryEntry: asyncHandler(async (req, res) => {
    const entry = await diaryService.createEntry(req, req.schoolId, req.body);
    return created(res, { entry }, 'Diary entry created successfully', req);
  }),

  listDiaryEntries: asyncHandler(async (req, res) => {
    const { data, pagination } = await diaryService.listEntries(req, req.schoolId, req.query);
    return paginated(res, { entries: data }, pagination, 'Diary entries fetched successfully', req);
  }),

  getDiaryEntry: asyncHandler(async (req, res) => {
    const entry = await diaryService.getEntry(req, req.schoolId, req.params.entryId);
    return success(res, { entry }, 'Diary entry fetched successfully', undefined, req);
  }),

  markDiaryRead: asyncHandler(async (req, res) => {
    const entry = await diaryService.markRead(
      req.schoolId,
      req.params.entryId,
      req.auth.userId,
      req.query.studentId
    );
    return success(res, { entry }, 'Diary entry marked as read', undefined, req);
  }),

  updateDiaryEntry: asyncHandler(async (req, res) => {
    const entry = await diaryService.updateEntry(req, req.schoolId, req.params.entryId, req.body);
    return success(res, { entry }, 'Diary entry updated successfully', undefined, req);
  }),

  deleteDiaryEntry: asyncHandler(async (req, res) => {
    await diaryService.deleteEntry(req, req.schoolId, req.params.entryId, req.auth.userId);
    return success(res, null, 'Diary entry deleted successfully', undefined, req);
  }),

  listVendors: asyncHandler(async (req, res) => {
    const { data, pagination } = await vendorDirectoryService.listApprovedVendors(req.query);
    return paginated(res, { vendors: data }, pagination, 'Vendors fetched successfully', req);
  }),

  createRfq: asyncHandler(async (req, res) => {
    const rfq = await rfqService.createRfq(req.schoolId, req.body);
    return created(res, { rfq }, 'Quotation request published successfully', req);
  }),

  listRfqs: asyncHandler(async (req, res) => {
    const { data, pagination } = await rfqService.listSchoolRfqs(req.schoolId, req.query);
    return paginated(res, { rfqs: data }, pagination, 'RFQs fetched successfully', req);
  }),

  getRfq: asyncHandler(async (req, res) => {
    const rfq = await rfqService.getSchoolRfq(req.schoolId, req.params.rfqId);
    return success(res, { rfq }, 'RFQ fetched successfully', undefined, req);
  }),

  updateRfq: asyncHandler(async (req, res) => {
    const rfq = await rfqService.updateRfq(req.schoolId, req.params.rfqId, req.body);
    return success(res, { rfq }, 'RFQ updated successfully', undefined, req);
  }),

  awardRfqQuote: asyncHandler(async (req, res) => {
    const rfq = await rfqService.awardQuote(req.schoolId, req.params.rfqId, req.params.quoteId);
    return success(res, { rfq }, 'Contract awarded successfully', undefined, req);
  }),

  createParent: asyncHandler(async (req, res) => {
    const result = await parentService.createParent(req.schoolId, req.body);
    return created(res, result, 'Parent created successfully', req);
  }),

  listParents: asyncHandler(async (req, res) => {
    const { data, pagination } = await parentService.listParents(req.schoolId, req.query);
    return paginated(res, { parents: data }, pagination, 'Parents fetched successfully', req);
  }),

  getParent: asyncHandler(async (req, res) => {
    const parent = await parentService.getParent(req.schoolId, req.params.parentId);
    return success(res, { parent }, 'Parent fetched successfully', undefined, req);
  }),

  updateParent: asyncHandler(async (req, res) => {
    const parent = await parentService.updateParent(req.schoolId, req.params.parentId, req.body);
    return success(res, { parent }, 'Parent updated successfully', undefined, req);
  }),

  deleteParent: asyncHandler(async (req, res) => {
    await parentService.deleteParent(req.schoolId, req.params.parentId);
    return success(res, null, 'Parent deleted successfully', undefined, req);
  }),

  uploadAttachment: asyncHandler(async (req, res) => {
    const attachment = await attachmentService.createFromUpload({
      ownerUserId: req.auth.userId,
      purpose: req.body.purpose || 'kit_image',
      file: req.file,
    });
    return created(res, { attachment }, 'File uploaded successfully', req);
  }),
};

module.exports = schoolController;
