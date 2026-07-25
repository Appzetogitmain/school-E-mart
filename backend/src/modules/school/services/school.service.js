const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const schoolRepository = require('../repositories/school.repository');
const { generateSchoolCode } = require('../utils/refId');
const { saveBase64File } = require('../../../utils/fileStorage');

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

    const updatePayload = { ...payload };
    const rawLogo = updatePayload.logoUrl || updatePayload.logo || updatePayload.photo;
    if (rawLogo) {
      const saved = saveBase64File(rawLogo, 'school-logo');
      if (saved) updatePayload.logoUrl = saved;
    }
    delete updatePayload.logo;
    delete updatePayload.photo;

    return schoolRepository.create({
      ...updatePayload,
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
    const updatePayload = { ...payload };
    const rawLogo = updatePayload.logoUrl || updatePayload.logo || updatePayload.photo;
    if (rawLogo) {
      const saved = saveBase64File(rawLogo, 'school-logo');
      if (saved) updatePayload.logoUrl = saved;
    }
    delete updatePayload.logo;
    delete updatePayload.photo;

    const school = await schoolRepository.updateById(schoolId, { $set: updatePayload });
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
