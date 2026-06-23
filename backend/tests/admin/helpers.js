const School = require('../../src/database/models/School');
const { generateSchoolCode } = require('../../src/modules/school/utils/refId');
const { createAdminUser, createVendorUser, authHeaderFor } = require('../vendor/helpers');

const seedSchool = async ({ partnerStatus = 'prospect', name = 'Test School' } = {}) => {
  const school = await School.create({
    code: generateSchoolCode(name),
    name,
    schoolRefNo: `REF-${Date.now()}`,
    partnerStatus,
    gradesOffered: ['Class 1'],
    sectionsConfig: [{ class: 'Class 1', sections: ['A'] }],
  });
  return school;
};

module.exports = {
  createAdminUser,
  createVendorUser,
  authHeaderFor,
  seedSchool,
};
