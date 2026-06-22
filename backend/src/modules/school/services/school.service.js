const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const schoolRepository = require('../repositories/school.repository');
const { generateSchoolCode } = require('../utils/refId');

const schoolService = {
  async createSchool(payload) {
    const code = payload.code || generateSchoolCode(payload.name);
    const existing = await schoolRepository.findByCode(code);
    if (existing) {
      throw new ConflictError('School code already exists', 'SCHOOL_CODE_EXISTS');
    }

    const refExisting = await schoolRepository.findBySchoolRefNo(payload.schoolRefNo);
    if (refExisting) {
      throw new ConflictError('School reference number already exists', 'SCHOOL_REF_EXISTS');
    }

    return schoolRepository.create({
      ...payload,
      code,
      gradesOffered: payload.gradesOffered || [],
      sectionsConfig: payload.sectionsConfig || [],
    });
  },

  async getSchool(schoolId) {
    const school = await schoolRepository.findById(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    return school;
  },

  async listSchools(query) {
    return schoolRepository.paginateSchools({}, query);
  },

  async updateSchool(schoolId, payload) {
    const school = await schoolRepository.updateById(schoolId, { $set: payload });
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    return school;
  },

  async deleteSchool(schoolId, deletedBy) {
    const school = await schoolRepository.softDeleteById(schoolId, { deletedBy });
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    return school;
  },
};

module.exports = schoolService;
