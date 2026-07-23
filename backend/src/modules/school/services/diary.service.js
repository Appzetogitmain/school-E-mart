const { NotFoundError, ForbiddenError } = require('../../../common/errors');
const { roles } = require('../../../constants');
const diaryRepository = require('../repositories/diary.repository');
const { assertTeacherClassAccess } = require('../policies/schoolAccess.policy');

const { ROLES } = roles;

const buildParentDiaryFilter = async (schoolId, userId, studentId) => {
  const studentLookup = require('../../lms/repositories/student.repository');
  const resolved = await studentLookup.resolveStudentForUser(schoolId, userId, studentId);
  if (!resolved?.student) {
    throw new ForbiddenError('Student context is required', 'STUDENT_REQUIRED');
  }

  const student = resolved.student;
  const rawGrade = String(student.classGrade || '').trim();
  const normalizedClassGrade = rawGrade.replace(/^(class|grade|std)\s+/i, '').trim();

  const gradeVariants = [
    rawGrade,
    normalizedClassGrade,
    `Class ${normalizedClassGrade}`,
    `Grade ${normalizedClassGrade}`,
    `Std ${normalizedClassGrade}`
  ].filter(Boolean);

  const sectionFilter = student.section
    ? { $or: [{ section: { $exists: false } }, { section: null }, { section: '' }, { section: new RegExp(`^${student.section}$`, 'i') }] }
    : {};

  return {
    schoolId,
    $or: [
      { studentId: student._id },
      {
        classGrade: { $in: gradeVariants },
        ...sectionFilter,
        $or: [{ studentId: null }, { studentId: { $exists: false } }],
      },
    ],
  };
};

const diaryService = {
  async createEntry(req, schoolId, payload) {
    if (req.auth.role === ROLES.TEACHER) {
      await assertTeacherClassAccess(req, {
        classGrade: payload.classGrade,
        section: payload.section,
      });
    }

    return diaryRepository.create({
      schoolId,
      teacherId: req.auth.userId,
      title: payload.title,
      content: payload.content,
      classGrade: payload.classGrade,
      section: payload.section,
      studentId: payload.studentId || null,
      attachments: payload.attachments || [],
    });
  },

  async listEntries(req, schoolId, query) {
    if (req.auth.role === ROLES.PARENT) {
      const filter = await buildParentDiaryFilter(schoolId, req.auth.userId, query.studentId);
      return diaryRepository.paginateDiary(filter, query);
    }

    const filter = { schoolId };
    if (req.auth.role === ROLES.TEACHER) {
      filter.teacherId = req.auth.userId;
    }
    if (query.classGrade) {
      const raw = String(query.classGrade).trim();
      const norm = raw.replace(/^(class|grade|std)\s+/i, '').trim();
      filter.classGrade = { $in: [raw, norm, `Class ${norm}`, `Grade ${norm}`] };
    }
    if (query.section) {
      filter.section = new RegExp(`^${query.section.trim()}$`, 'i');
    }
    if (query.studentId) filter.studentId = query.studentId;
    return diaryRepository.paginateDiary(filter, query);
  },

  async getEntry(req, schoolId, entryId) {
    const entry = await diaryRepository.findOne({ _id: entryId, schoolId });
    if (!entry) throw new NotFoundError('Diary entry not found', 'DIARY_NOT_FOUND');

    if (req.auth.role === ROLES.PARENT) {
      const filter = await buildParentDiaryFilter(schoolId, req.auth.userId, req.query.studentId);
      const allowed = await diaryRepository.findOne({ _id: entryId, ...filter });
      if (!allowed) throw new ForbiddenError('Diary entry is not available', 'DIARY_ACCESS_DENIED');
    }

    if (req.auth.role === ROLES.TEACHER && String(entry.teacherId) !== String(req.auth.userId)) {
      throw new ForbiddenError('You can only view your own diary entries', 'DIARY_ACCESS_DENIED');
    }

    return entry;
  },

  async markRead(schoolId, entryId, userId, studentId) {
    const filter = await buildParentDiaryFilter(schoolId, userId, studentId);
    const entry = await diaryRepository.findOne({ _id: entryId, ...filter });
    if (!entry) throw new NotFoundError('Diary entry not found', 'DIARY_NOT_FOUND');

    return diaryRepository.updateById(entryId, {
      $set: { isReadByParent: true, readAt: new Date() },
    });
  },

  async updateEntry(req, schoolId, entryId, payload) {
    const entry = await diaryRepository.findOne({ _id: entryId, schoolId });
    if (!entry) throw new NotFoundError('Diary entry not found', 'DIARY_NOT_FOUND');

    if (req.auth.role === ROLES.TEACHER && String(entry.teacherId) !== String(req.auth.userId)) {
      throw new ForbiddenError('You can only edit your own diary entries', 'DIARY_ACCESS_DENIED');
    }

    return diaryRepository.updateById(entryId, { $set: payload });
  },

  async deleteEntry(req, schoolId, entryId, deletedBy) {
    const entry = await diaryRepository.findOne({ _id: entryId, schoolId });
    if (!entry) throw new NotFoundError('Diary entry not found', 'DIARY_NOT_FOUND');

    if (req.auth.role === ROLES.TEACHER && String(entry.teacherId) !== String(req.auth.userId)) {
      throw new ForbiddenError('You can only delete your own diary entries', 'DIARY_ACCESS_DENIED');
    }

    return diaryRepository.softDeleteById(entryId, { deletedBy });
  },
};

module.exports = diaryService;
