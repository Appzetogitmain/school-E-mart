const SchoolStaffProfile = require('../../../database/models/SchoolStaffProfile');
const TeacherProfile = require('../../../database/models/TeacherProfile');
const VendorProfile = require('../../../database/models/VendorProfile');
const AdminProfile = require('../../../database/models/AdminProfile');
const School = require('../../../database/models/School');

const profileRepository = {
  async getSchoolStaffByUserId(userId) {
    return SchoolStaffProfile.findOne({
      userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();
  },

  /** Login needs the school's partnerStatus to decide whether its admins may sign in. */
  async getSchoolById(schoolId) {
    return School.findOne({
      _id: schoolId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();
  },

  async getTeacherByUserId(userId) {
    return TeacherProfile.findOne({
      userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();
  },

  async getVendorByUserId(userId) {
    return VendorProfile.findOne({
      userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();
  },

  async getAdminByUserId(userId) {
    return AdminProfile.findOne({
      userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();
  },
};

module.exports = profileRepository;
