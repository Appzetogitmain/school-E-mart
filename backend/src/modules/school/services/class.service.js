const { NotFoundError, ConflictError } = require('../../../common/errors');
const schoolRepository = require('../repositories/school.repository');
const teacherRepository = require('../repositories/teacher.repository');

const buildClassMapFromAssignments = (classAssignments = []) => {
  const classMap = new Map();
  classAssignments.forEach((assignment) => {
    if (!assignment?.class) return;
    const existing = classMap.get(assignment.class) || {
      classGrade: assignment.class,
      sections: [],
      classTeachers: {},
    };
    if (assignment.section && !existing.sections.includes(assignment.section)) {
      existing.sections.push(assignment.section);
    }
    classMap.set(assignment.class, existing);
  });
  return classMap;
};

const classService = {
  async syncAssignmentsToSchoolConfig(schoolId, classAssignments = []) {
    if (!classAssignments.length) return null;

    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const gradesOffered = new Set(school.gradesOffered || []);
    const sectionsByClass = new Map(
      (school.sectionsConfig || []).map((entry) => [entry.class, new Set(entry.sections || [])])
    );

    classAssignments.forEach(({ class: classGrade, section }) => {
      if (!classGrade) return;
      gradesOffered.add(classGrade);
      if (!sectionsByClass.has(classGrade)) {
        sectionsByClass.set(classGrade, new Set());
      }
      if (section) sectionsByClass.get(classGrade).add(section);
    });

    const sectionsConfig = Array.from(sectionsByClass.entries()).map(([classGrade, sections]) => ({
      class: classGrade,
      sections: Array.from(sections),
    }));

    await schoolRepository.updateGradesOffered(schoolId, Array.from(gradesOffered));
    return schoolRepository.updateSectionsConfig(schoolId, sectionsConfig);
  },

  async listClasses(schoolId, { userId } = {}) {
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

    if (!classMap.size && userId) {
      const profile = await teacherRepository.findOne({
        userId,
        schoolId,
        approvalStatus: 'approved',
        'softDelete.isDeleted': { $ne: true },
      });
      buildClassMapFromAssignments(profile?.classAssignments || []).forEach((value, key) => {
        classMap.set(key, value);
      });
    }

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
