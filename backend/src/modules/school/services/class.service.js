const { NotFoundError, ConflictError } = require('../../../common/errors');
const schoolRepository = require('../repositories/school.repository');
const teacherRepository = require('../repositories/teacher.repository');

const classService = {
  async listClasses(schoolId) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const classMap = new Map();
    (school.gradesOffered || []).forEach((classGrade) => {
      classMap.set(classGrade, { classGrade, sections: [], classTeachers: {} });
    });

    (school.sectionsConfig || []).forEach((entry) => {
      const existing = classMap.get(entry.class) || { classGrade: entry.class, sections: [], classTeachers: {} };
      existing.sections = entry.sections || [];
      classMap.set(entry.class, existing);
    });

    const teachers = await teacherRepository.findMany({ schoolId });
    teachers.forEach((teacher) => {
      (teacher.classAssignments || []).forEach((assignment) => {
        const item = classMap.get(assignment.class);
        if (item && assignment.section) {
          item.classTeachers[assignment.section] = {
            teacherProfileId: teacher._id,
            userId: teacher.userId,
            designation: teacher.designation,
          };
        }
      });
    });

    return Array.from(classMap.values());
  },

  async createClass(schoolId, { classGrade, sections = [] }) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const gradesOffered = Array.from(new Set([...(school.gradesOffered || []), classGrade]));
    const sectionsConfig = [...(school.sectionsConfig || [])];
    const existing = sectionsConfig.find((item) => item.class === classGrade);
    if (existing) {
      throw new ConflictError('Class already exists', 'CLASS_EXISTS');
    }
    sectionsConfig.push({ class: classGrade, sections });

    await schoolRepository.updateGradesOffered(schoolId, gradesOffered);
    return schoolRepository.updateSectionsConfig(schoolId, sectionsConfig);
  },

  async updateClass(schoolId, classGrade, { newClassGrade, sections }) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    let gradesOffered = [...(school.gradesOffered || [])];
    let sectionsConfig = [...(school.sectionsConfig || [])];
    const index = sectionsConfig.findIndex((item) => item.class === classGrade);
    if (index === -1) throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');

    if (newClassGrade && newClassGrade !== classGrade) {
      gradesOffered = gradesOffered.map((g) => (g === classGrade ? newClassGrade : g));
      sectionsConfig[index].class = newClassGrade;
    }
    if (sections) sectionsConfig[index].sections = sections;

    await schoolRepository.updateGradesOffered(schoolId, gradesOffered);
    return schoolRepository.updateSectionsConfig(schoolId, sectionsConfig);
  },

  async deleteClass(schoolId, classGrade) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const gradesOffered = (school.gradesOffered || []).filter((g) => g !== classGrade);
    const sectionsConfig = (school.sectionsConfig || []).filter((item) => item.class !== classGrade);

    await schoolRepository.updateGradesOffered(schoolId, gradesOffered);
    return schoolRepository.updateSectionsConfig(schoolId, sectionsConfig);
  },

  async assignClassTeacher(schoolId, classGrade, section, teacherProfileId) {
    const teacher = await teacherRepository.findOne({ _id: teacherProfileId, schoolId });
    if (!teacher) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    const assignments = [...(teacher.classAssignments || [])];
    const existingIndex = assignments.findIndex((a) => a.class === classGrade && a.section === section);
    if (existingIndex >= 0) assignments[existingIndex] = { class: classGrade, section };
    else assignments.push({ class: classGrade, section });

    await teacherRepository.updateById(teacherProfileId, {
      $set: { classAssignments: assignments, designation: teacher.designation || 'Class Teacher' },
    });

    return { classGrade, section, teacherProfileId };
  },
};

module.exports = classService;
