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
      // Subjects this teacher is assigned, keyed by section — a teacher can
      // teach different subjects in different sections of the same class
      subjectsBySection: {},
    };
    if (assignment.section && !existing.sections.includes(assignment.section)) {
      existing.sections.push(assignment.section);
    }
    if (assignment.section) {
      const subjects = new Set(existing.subjectsBySection[assignment.section] || []);
      (assignment.subjects || []).forEach((subject) => subjects.add(subject));
      existing.subjectsBySection[assignment.section] = Array.from(subjects);
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

    if (userId) {
      // Teacher view: strictly the classes/sections they are assigned to —
      // an unassigned teacher gets an empty list, not the whole school
      const profile = await teacherRepository.findOne({
        userId,
        schoolId,
        approvalStatus: 'approved',
        'softDelete.isDeleted': { $ne: true },
      });

      buildClassMapFromAssignments(profile?.classAssignments || []).forEach((value, key) => {
        classMap.set(key, value);
      });
    } else {
      (school.gradesOffered || []).forEach((classGrade) => {
        classMap.set(classGrade, { classGrade, sections: [], classTeachers: {} });
      });

      (school.sectionsConfig || []).forEach((entry) => {
        const existing = classMap.get(entry.class) || { classGrade: entry.class, sections: [], classTeachers: {} };
        existing.sections = entry.sections || [];
        classMap.set(entry.class, existing);
      });
    }

    const teachers = await teacherRepository.findMany({ schoolId });
    const classTeacherEntries = [];
    teachers.forEach((teacher) => {
      (teacher.classAssignments || []).forEach((assignment) => {
        const item = classMap.get(assignment.class);
        // Only an explicit class-teacher assignment counts — merely teaching
        // a subject in the section does not make someone the class teacher
        if (item && assignment.section && assignment.isClassTeacher) {
          const entry = {
            teacherProfileId: teacher._id,
            userId: teacher.userId,
            designation: teacher.designation,
            name: '',
          };
          item.classTeachers[assignment.section] = entry;
          classTeacherEntries.push(entry);
        }
      });
    });

    if (classTeacherEntries.length) {
      const User = require('../../../database/models/User');
      const users = await User.find({ _id: { $in: classTeacherEntries.map((e) => e.userId) } })
        .select('name')
        .lean();
      const nameById = new Map(users.map((u) => [String(u._id), u.name]));
      classTeacherEntries.forEach((entry) => {
        entry.name = nameById.get(String(entry.userId)) || '';
      });
    }

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

  // Create or update a teacher's assignment for one class+section. When
  // isClassTeacher is set, the flag is removed from every other teacher of
  // that section and from the teacher's other sections (one class teacher
  // per section, one section per class teacher).
  async upsertAssignment(schoolId, teacherProfileId, { classGrade, section, subjects = [], isClassTeacher = false }) {
    const TeacherProfile = require('../../../database/models/TeacherProfile');

    const teacher = await teacherRepository.findOne({ _id: teacherProfileId, schoolId });
    if (!teacher) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    // The class+section must already exist in the school structure —
    // assignments don't invent classes
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    const sectionEntry = (school.sectionsConfig || []).find((item) => item.class === classGrade);
    if (!sectionEntry || !(sectionEntry.sections || []).includes(section)) {
      throw new NotFoundError('Class or section not found in school structure', 'CLASS_SECTION_NOT_FOUND');
    }

    if (isClassTeacher) {
      // Demote any other class teacher of this section
      await TeacherProfile.updateMany(
        { schoolId, _id: { $ne: teacher._id }, 'classAssignments.class': classGrade, 'classAssignments.section': section },
        { $set: { 'classAssignments.$[elem].isClassTeacher': false } },
        { arrayFilters: [{ 'elem.class': classGrade, 'elem.section': section }] }
      );
    }

    const cleanSubjects = Array.from(new Set(subjects.map((s) => String(s).trim()).filter(Boolean)));

    const assignments = (teacher.classAssignments || []).map((a) => ({
      class: a.class,
      section: a.section,
      subjects: a.subjects || [],
      // A teacher can be class teacher of only one section at a time
      isClassTeacher: isClassTeacher ? false : Boolean(a.isClassTeacher),
    }));
    const existingIndex = assignments.findIndex((a) => a.class === classGrade && a.section === section);
    const entry = { class: classGrade, section, subjects: cleanSubjects, isClassTeacher };
    if (existingIndex >= 0) assignments[existingIndex] = entry;
    else assignments.push(entry);

    // Keep the profile-level subject list in sync with what they teach
    const subjectsTaught = Array.from(
      new Set(assignments.flatMap((a) => a.subjects || []))
    );

    await teacherRepository.updateById(teacherProfileId, {
      $set: { classAssignments: assignments, subjectsTaught },
    });

    return this.listTeacherAssignments(schoolId);
  },

  async removeAssignment(schoolId, teacherProfileId, { classGrade, section }) {
    const teacher = await teacherRepository.findOne({ _id: teacherProfileId, schoolId });
    if (!teacher) throw new NotFoundError('Teacher not found', 'TEACHER_NOT_FOUND');

    const assignments = (teacher.classAssignments || []).filter(
      (a) => !(a.class === classGrade && a.section === section)
    );
    if (assignments.length === (teacher.classAssignments || []).length) {
      throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    }

    const subjectsTaught = Array.from(
      new Set(assignments.flatMap((a) => a.subjects || []))
    );

    await teacherRepository.updateById(teacherProfileId, {
      $set: { classAssignments: assignments, subjectsTaught },
    });

    return this.listTeacherAssignments(schoolId);
  },

  // Overview for the school's Class & Teacher Assignments page: every
  // approved teacher with their user info and assignments
  async listTeacherAssignments(schoolId) {
    const User = require('../../../database/models/User');

    const teachers = await teacherRepository.findMany({
      schoolId,
      approvalStatus: 'approved',
      'softDelete.isDeleted': { $ne: true },
    });

    const userIds = teachers.map((t) => t.userId).filter(Boolean);
    const users = await User.find({ _id: { $in: userIds } })
      .select('name phone email')
      .lean();
    const userById = new Map(users.map((u) => [String(u._id), u]));

    return teachers.map((t) => ({
      teacherProfileId: t._id,
      userId: t.userId,
      name: userById.get(String(t.userId))?.name || '—',
      phone: userById.get(String(t.userId))?.phone || '',
      designation: t.designation || '',
      classAssignments: (t.classAssignments || []).map((a) => ({
        class: a.class,
        section: a.section,
        subjects: a.subjects || [],
        isClassTeacher: Boolean(a.isClassTeacher),
      })),
    }));
  },
};

module.exports = classService;
