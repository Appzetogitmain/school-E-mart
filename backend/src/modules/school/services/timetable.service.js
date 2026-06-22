const { NotFoundError, ConflictError } = require('../../../common/errors');
const timetableRepository = require('../repositories/timetable.repository');
const teacherRepository = require('../repositories/teacher.repository');
const lookupRepository = require('../repositories/lookup.repository');

const timetableService = {
  async assertNoConflicts(payload, excludeId = null) {
    const [teacherConflict, roomConflict] = await timetableRepository.findConflicts({
      ...payload,
      excludeId,
    });

    if (teacherConflict) {
      throw new ConflictError('Teacher has a scheduling conflict', 'TEACHER_TIMETABLE_CONFLICT');
    }
    if (roomConflict) {
      throw new ConflictError('Classroom has a scheduling conflict', 'CLASSROOM_TIMETABLE_CONFLICT');
    }
  },

  async createSlot(schoolId, payload) {
    const teacher = await teacherRepository.findOne({ _id: payload.teacherProfileId, schoolId });
    if (!teacher) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    const subject = await lookupRepository.findByTypeAndCode(
      'subject',
      payload.subjectCode,
      String(schoolId)
    );
    if (!subject) throw new NotFoundError('Subject not found', 'SUBJECT_NOT_FOUND');

    await this.assertNoConflicts({ schoolId, ...payload });

    return timetableRepository.create({
      schoolId,
      academicYear: payload.academicYear,
      classGrade: payload.classGrade,
      section: payload.section,
      dayOfWeek: payload.dayOfWeek,
      periodNumber: payload.periodNumber,
      startTime: payload.startTime,
      endTime: payload.endTime,
      subjectCode: payload.subjectCode,
      subjectLabel: subject.label,
      teacherProfileId: payload.teacherProfileId,
      room: payload.room,
    });
  },

  async listTimetable(schoolId, query) {
    const filter = { schoolId };
    if (query.academicYear) filter.academicYear = query.academicYear;
    if (query.classGrade) filter.classGrade = query.classGrade;
    if (query.section) filter.section = query.section;
    if (query.teacherProfileId) filter.teacherProfileId = query.teacherProfileId;
  if (query.dayOfWeek !== undefined) filter.dayOfWeek = Number(query.dayOfWeek);
    return timetableRepository.paginateTimetable(filter, query);
  },

  async getClassTimetable(schoolId, { academicYear, classGrade, section }) {
    return timetableRepository.findMany({
      schoolId,
      academicYear,
      classGrade,
      section,
    });
  },

  async getTeacherTimetable(schoolId, { academicYear, teacherProfileId }) {
    return timetableRepository.findMany({
      schoolId,
      academicYear,
      teacherProfileId,
    });
  },

  async updateSlot(schoolId, slotId, payload) {
    const existing = await timetableRepository.findOne({ _id: slotId, schoolId });
    if (!existing) throw new NotFoundError('Timetable slot not found', 'TIMETABLE_NOT_FOUND');

    const merged = { ...existing, ...payload, schoolId };
    await this.assertNoConflicts(merged, slotId);

    return timetableRepository.updateById(slotId, { $set: payload }, { schoolId });
  },

  async deleteSlot(schoolId, slotId, deletedBy) {
    const slot = await timetableRepository.softDeleteById(slotId, { deletedBy });
    if (!slot) throw new NotFoundError('Timetable slot not found', 'TIMETABLE_NOT_FOUND');
    return slot;
  },
};

module.exports = timetableService;
