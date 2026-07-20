const { ConflictError } = require('../../../common/errors');
const { runAtomic } = require('../../orders/utils/atomic');
const { hashPassword, normalizeEmail, normalizePhone } = require('../../../utils');
const logger = require('../../../common/logger');
const emailService = require('../../../common/email');
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

// `code` carries a unique index but nothing used to check it before inserting, so
// a collision surfaced as a raw E11000 write error instead of a retry.
const ensureUniqueSchoolCode = async (schoolName) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateSchoolCode(schoolName);
    const existing = await schoolRepository.findByCode(code);
    if (!existing) return code;
  }
  throw new ConflictError('Could not generate school code. Please try again.', 'SCHOOL_CODE_GENERATION_FAILED');
};

// Drops undefined/'' so a partially filled form does not overwrite stored values
// with blanks, and does not persist empty strings the UI then renders as content.
const pruneEmpty = (source = {}) => {
  const result = {};
  Object.entries(source).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string' && value.trim() === '') return;
    result[key] = typeof value === 'string' ? value.trim() : value;
  });
  return result;
};

const assertContactAvailable = async ({ email, phone }) => {
  if (email) {
    const existing = await userRepository.findByEmail(email);
    if (existing) throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
  }
  if (phone) {
    const existing = await userRepository.findByPhone(phone);
    if (existing) throw new ConflictError('Phone already registered', 'PHONE_EXISTS');
  }
};

/**
 * Creates the School + admin User + staff profile.
 *
 * Public signup and admin creation share this so the two cannot drift; they differ
 * only in `partnerStatus` — a self-registered school starts as a 'prospect' awaiting
 * review, whereas one an admin enters by hand is already vetted and goes straight to
 * 'active'.
 */
const createSchoolWithAdmin = async ({ payload, partnerStatus }) => {
  const email = normalizeEmail(payload.email);
  const phone = normalizePhone(payload.mobile || payload.phone);

  await assertContactAvailable({ email, phone });

  const schoolRefNo = await ensureUniqueSchoolRefNo();
  const code = await ensureUniqueSchoolCode(payload.schoolName);
  const { hash, algo } = await hashPassword(payload.password);

  const address = pruneEmpty(payload.address || {});

  // runAtomic, not withTransaction: transactions need a replica set, and this ran
  // unconditionally so registration failed outright on a standalone MongoDB.
  // runAtomic falls back to sequential writes when they are unavailable.
  return runAtomic(async (session) => {
    const options = session ? { session } : {};
    let school = null;
    let user = null;

    try {
      [school] = await School.create(
        [
          {
            code,
            name: payload.schoolName,
            principalName: payload.principalName || payload.fullName,
            adminEmail: email,
            schoolRefNo,
            partnerStatus,
            ...(Object.keys(address).length ? { address } : {}),
            ...pruneEmpty({
              academicYearCurrent: payload.academicYearCurrent,
            }),
            ...(payload.gradesOffered?.length ? { gradesOffered: payload.gradesOffered } : {}),
          },
        ],
        options
      );

      [user] = await User.create(
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
        options
      );

      await SchoolStaffProfile.create(
        [
          {
            userId: user._id,
            schoolId: school._id,
            designation: 'Admin',
          },
        ],
        options
      );

      return { user, school, schoolRefNo };
    } catch (error) {
      // A transaction rolls these back for us. Without one there is nothing to
      // undo the partial write, and leaving it behind burns the email and phone
      // permanently: every retry would fail with EMAIL_EXISTS against a half-built
      // account the owner can never log into.
      if (!session) {
        if (user) await User.deleteOne({ _id: user._id });
        if (school) await School.deleteOne({ _id: school._id });
      }
      throw error;
    }
  });
};

/**
 * Account mail is best-effort. A misconfigured or unreachable SMTP host must not
 * fail a registration that already committed — the account exists either way, and
 * throwing here would tell the caller the signup failed when it did not.
 */
const sendAccountEmail = async (send, context) => {
  try {
    await send();
  } catch (error) {
    logger.error('School account email failed to send', { ...context, error: error.message });
  }
};

const schoolAdminRegistrationService = {
  async register(payload) {
    const result = await createSchoolWithAdmin({ payload, partnerStatus: 'prospect' });

    await sendAccountEmail(
      () => emailService.sendSchoolRegistrationPendingEmail({
        to: result.user.email,
        name: result.user.name,
        schoolName: result.school.name,
        schoolRefNo: result.schoolRefNo,
      }),
      { schoolId: result.school._id, stage: 'registration-pending' }
    );

    return result;
  },

  /** Admin-entered schools skip review — the admin is the reviewer. */
  async createByAdmin(payload) {
    const result = await createSchoolWithAdmin({ payload, partnerStatus: 'active' });

    await sendAccountEmail(
      () => emailService.sendSchoolWelcomeEmail({
        to: result.user.email,
        name: result.user.name,
        schoolName: result.school.name,
        schoolRefNo: result.schoolRefNo,
        password: payload.password,
      }),
      { schoolId: result.school._id, stage: 'admin-created' }
    );

    return result;
  },
};

module.exports = schoolAdminRegistrationService;
