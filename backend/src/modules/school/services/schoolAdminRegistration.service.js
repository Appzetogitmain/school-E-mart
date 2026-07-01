const { ConflictError } = require('../../../common/errors');
const { withTransaction } = require('../../../database');
const { hashPassword, normalizeEmail, normalizePhone } = require('../../../utils');
const User = require('../../../database/models/User');
const School = require('../../../database/models/School');
const SchoolStaffProfile = require('../../../database/models/SchoolStaffProfile');
const schoolRepository = require('../repositories/school.repository');
const userRepository = require('../../auth/repositories/user.repository');
const { generateSchoolCode, generateSchoolRefNo } = require('../utils/refId');

const ensureUniqueSchoolRefNo = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const schoolRefNo = generateSchoolRefNo();
    const existing = await schoolRepository.findBySchoolRefNo(schoolRefNo);
    if (!existing) return schoolRefNo;
  }
  throw new ConflictError('Could not generate school code. Please try again.', 'SCHOOL_REF_GENERATION_FAILED');
};

const schoolAdminRegistrationService = {
  async register(payload) {
    const email = normalizeEmail(payload.email);
    const phone = normalizePhone(payload.mobile || payload.phone);

    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) throw new ConflictError('Email already registered', 'EMAIL_EXISTS');

    const existingPhone = await userRepository.findByPhone(phone);
    if (existingPhone) throw new ConflictError('Phone already registered', 'PHONE_EXISTS');

    const schoolRefNo = await ensureUniqueSchoolRefNo();
    const code = generateSchoolCode(payload.schoolName);
    const { hash, algo } = await hashPassword(payload.password);

    return withTransaction(async (session) => {
      const [school] = await School.create(
        [
          {
            code,
            name: payload.schoolName,
            principalName: payload.fullName,
            adminEmail: email,
            schoolRefNo,
            partnerStatus: 'prospect',
          },
        ],
        { session }
      );

      const [user] = await User.create(
        [
          {
            refId: schoolRefNo,
            role: 'school',
            status: 'active',
            name: payload.fullName,
            email,
            phone,
            passwordHash: hash,
            passwordAlgo: algo,
            tenantSchoolId: school._id,
            emailVerifiedAt: new Date(),
            phoneVerifiedAt: new Date(),
          },
        ],
        { session }
      );

      await SchoolStaffProfile.create(
        [
          {
            userId: user._id,
            schoolId: school._id,
            designation: 'Admin',
          },
        ],
        { session }
      );

      return { user, school, schoolRefNo };
    });
  },
};

module.exports = schoolAdminRegistrationService;
