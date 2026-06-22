const { NotFoundError, ConflictError } = require('../../../common/errors');
const Student = require('../../../database/models/Student');
const schoolRepository = require('../repositories/school.repository');
const studentRepository = require('../repositories/student.repository');

const sectionService = {
  async listSections(schoolId, classGrade) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    const entry = (school.sectionsConfig || []).find((item) => item.class === classGrade);
    if (!entry) throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');
    return { classGrade, sections: entry.sections || [] };
  },

  async createSection(schoolId, classGrade, section) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const sectionsConfig = [...(school.sectionsConfig || [])];
    const index = sectionsConfig.findIndex((item) => item.class === classGrade);
    if (index === -1) throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');

    const sections = sectionsConfig[index].sections || [];
    if (sections.includes(section)) {
      throw new ConflictError('Section already exists', 'SECTION_EXISTS');
    }
    sections.push(section);
    sectionsConfig[index].sections = sections;

    return schoolRepository.updateSectionsConfig(schoolId, sectionsConfig);
  },

  async updateSection(schoolId, classGrade, section, newSection) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const sectionsConfig = [...(school.sectionsConfig || [])];
    const index = sectionsConfig.findIndex((item) => item.class === classGrade);
    if (index === -1) throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');

    const sections = [...(sectionsConfig[index].sections || [])];
    const sectionIndex = sections.indexOf(section);
    if (sectionIndex === -1) throw new NotFoundError('Section not found', 'SECTION_NOT_FOUND');
    sections[sectionIndex] = newSection;
    sectionsConfig[index].sections = sections;

    await Student.updateMany(
      { schoolId, classGrade, section, 'softDelete.isDeleted': { $ne: true } },
      { $set: { section: newSection } }
    );

    return schoolRepository.updateSectionsConfig(schoolId, sectionsConfig);
  },

  async deleteSection(schoolId, classGrade, section) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

    const sectionsConfig = [...(school.sectionsConfig || [])];
    const index = sectionsConfig.findIndex((item) => item.class === classGrade);
    if (index === -1) throw new NotFoundError('Class not found', 'CLASS_NOT_FOUND');

    sectionsConfig[index].sections = (sectionsConfig[index].sections || []).filter((s) => s !== section);
    return schoolRepository.updateSectionsConfig(schoolId, sectionsConfig);
  },

  async assignStudents(schoolId, classGrade, section, studentIds) {
    const updates = await Promise.all(
      studentIds.map((studentId) =>
        studentRepository.updateById(
          studentId,
          { $set: { classGrade, section } },
          { schoolId }
        )
      )
    );
    return updates.filter(Boolean);
  },
};

module.exports = sectionService;
