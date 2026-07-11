const { NotFoundError, ConflictError } = require('../../../common/errors');
const lookupRepository = require('../repositories/lookup.repository');
const teacherRepository = require('../repositories/teacher.repository');

const subjectService = {
  async listSubjects(schoolId, query) {
    return lookupRepository.paginateLookups(
      { type: 'subject', group: String(schoolId) },
      query
    );
  },

  async createSubject(schoolId, payload) {
    const existing = await lookupRepository.findByTypeAndCode('subject', payload.code, String(schoolId));
    if (existing) throw new ConflictError('Subject code already exists', 'SUBJECT_EXISTS');

    return lookupRepository.create({
      type: 'subject',
      code: payload.code,
      label: payload.label,
      group: String(schoolId),
      displayOrder: payload.displayOrder || 0,
      status: payload.status || 'active',
    });
  },

  async updateSubject(schoolId, code, payload) {
    const subject = await lookupRepository.findOne({ type: 'subject', code, group: String(schoolId) });
    if (!subject) throw new NotFoundError('Subject not found', 'SUBJECT_NOT_FOUND');
    return lookupRepository.updateById(subject._id, { $set: payload });
  },

  async deleteSubject(schoolId, code) {
    const subject = await lookupRepository.findOne({ type: 'subject', code, group: String(schoolId) });
    if (!subject) throw new NotFoundError('Subject not found', 'SUBJECT_NOT_FOUND');
    return lookupRepository.updateById(subject._id, { $set: { status: 'inactive' } });
  },

  async assignSubjectToClass(schoolId, { classGrade, section, subjectCode, teacherProfileId }) {
    const teacher = await teacherRepository.findOne({ _id: teacherProfileId, schoolId });
    if (!teacher) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    const subjectsTaught = Array.from(new Set([...(teacher.subjectsTaught || []), subjectCode]));
    const classAssignments = (teacher.classAssignments || []).map((a) => ({
      class: a.class,
      section: a.section,
      subjects: a.subjects || [],
      isClassTeacher: Boolean(a.isClassTeacher),
    }));
    const existing = classAssignments.find((a) => a.class === classGrade && a.section === section);
    if (existing) {
      existing.subjects = Array.from(new Set([...existing.subjects, subjectCode]));
    } else {
      classAssignments.push({ class: classGrade, section, subjects: [subjectCode], isClassTeacher: false });
    }

    await teacherRepository.updateById(teacherProfileId, {
      $set: { subjectsTaught, classAssignments },
    });

    return { classGrade, section, subjectCode, teacherProfileId };
  },
};

module.exports = subjectService;
