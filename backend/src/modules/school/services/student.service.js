const { NotFoundError, ConflictError } = require('../../../common/errors');
const { withTransaction } = require('../../../database');
const studentRepository = require('../repositories/student.repository');
const schoolUserRepository = require('../repositories/user.repository');
const { generateStudentRefNo, generateUserRefId } = require('../utils/refId');

// referralCode is globally unique on ParentProfile; the 4-digit space is small,
// so retry until an unused code is found instead of trusting a single draw
const generateUniqueReferralCode = async (ParentProfile, session) => {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const code = 'EMART' + Math.floor(1000 + Math.random() * 9000);
    const exists = await ParentProfile.findOne({ referralCode: code }).session(session);
    if (!exists) return code;
  }
  // 4-digit space saturated — fall back to a timestamp-based suffix
  return 'EMART' + Date.now().toString().slice(-8);
};

// Shared by registerStudent and updateStudent: find or create the parent
// account for payload.parentPhone and fully link it to the student
// (student.parentProfileIds, ChildProfile, activeChildId).
// Returns details of the linked parent so callers can act after the
// transaction commits (e.g. send the welcome email).
const linkParentByPhone = async (schoolId, student, payload, session) => {
  const { normalizePhone } = require('../../../utils');
  const User = require('../../../database/models/User');
  const ParentProfile = require('../../../database/models/ParentProfile');
  const ChildProfile = require('../../../database/models/ChildProfile');
  const School = require('../../../database/models/School');

  const normalizedPhone = normalizePhone(payload.parentPhone);
  const normalizedEmail = payload.parentEmail
    ? payload.parentEmail.trim().toLowerCase()
    : undefined;

  // User.phone is globally unique across roles; creating a second user with a
  // teacher's/vendor's phone would hit the unique index, so fail cleanly here
  const existingUser = await User.findOne({
    phone: normalizedPhone,
    'softDelete.isDeleted': { $ne: true },
  }).session(session);
  if (existingUser && existingUser.role !== 'parent') {
    throw new ConflictError(
      'This phone number belongs to an existing non-parent account',
      'PHONE_NOT_PARENT'
    );
  }

  if (normalizedEmail) {
    const emailOwner = await User.findEmailOwner(normalizedEmail, {
      excludeUserId: existingUser?._id,
      session,
    });
    if (emailOwner) {
      throw new ConflictError(
        `That email address already belongs to another account (${emailOwner.name}, ${emailOwner.role})`,
        'EMAIL_EXISTS'
      );
    }
  }

  let parentUser = existingUser;
  let parentProfile;
  let parentCreated = false;
  let emailBackfilled = false;

  if (parentUser) {
    // Backfill the email if the account doesn't have one yet
    if (normalizedEmail && !parentUser.email) {
      await User.updateOne(
        { _id: parentUser._id },
        { $set: { email: normalizedEmail } }
      ).session(session);
      emailBackfilled = true;
    }
    // Backfill the tenantSchoolId if not set
    if (!parentUser.tenantSchoolId) {
      await User.updateOne(
        { _id: parentUser._id },
        { $set: { tenantSchoolId: schoolId } }
      ).session(session);
      parentUser.tenantSchoolId = schoolId;
    }
    parentProfile = await ParentProfile.findOne({
      userId: parentUser._id,
      'softDelete.isDeleted': { $ne: true },
    }).session(session);
    if (!parentProfile) {
      const referralCode = await generateUniqueReferralCode(ParentProfile, session);
      const createdProfile = await ParentProfile.create(
        [{ userId: parentUser._id, referralCode }],
        { session }
      );
      parentProfile = createdProfile[0];
    }
  } else {
    const refId = generateUserRefId('P');
    const pName = payload.parentName || `${payload.name || student.name} Parent`;
    const createdUser = await User.create(
      [
        {
          refId,
          role: 'parent',
          status: 'active',
          name: pName,
          email: normalizedEmail,
          phone: normalizedPhone,
          phoneVerifiedAt: new Date(),
          // Without this the parent never appears in the school's parent list
          tenantSchoolId: schoolId,
        },
      ],
      { session }
    );
    parentUser = createdUser[0];
    parentCreated = true;

    const referralCode = await generateUniqueReferralCode(ParentProfile, session);
    const createdProfile = await ParentProfile.create(
      [{ userId: parentUser._id, referralCode }],
      { session }
    );
    parentProfile = createdProfile[0];
  }

  if (parentProfile) {
    await studentRepository.updateById(
      student._id,
      { $addToSet: { parentProfileIds: parentProfile._id } },
      {},
      { session }
    );
  }

  const schoolObj = await School.findById(schoolId).session(session);
  const schoolRefNoVal = schoolObj ? schoolObj.schoolRefNo : '';

  let childProfile = await ChildProfile.findOne({
    parentUserId: parentUser._id,
    studentId: student._id,
    'softDelete.isDeleted': { $ne: true },
  }).session(session);
  if (!childProfile) {
    const createdChild = await ChildProfile.create(
      [
        {
          parentUserId: parentUser._id,
          name: payload.name || student.name,
          schoolId,
          schoolRefNo: schoolRefNoVal,
          grade: payload.classGrade || student.classGrade,
          rollNo: payload.rollNo || student.rollNo,
          studentId: student._id,
        },
      ],
      { session }
    );
    childProfile = createdChild[0];
  } else {
    await ChildProfile.updateOne(
      { _id: childProfile._id },
      {
        $set: {
          name: payload.name || student.name,
          grade: payload.classGrade || student.classGrade,
          rollNo: payload.rollNo || student.rollNo,
          schoolId,
          schoolRefNo: schoolRefNoVal,
        },
      }
    ).session(session);
  }

  if (parentProfile && !parentProfile.activeChildId) {
    await ParentProfile.updateOne(
      { _id: parentProfile._id },
      { $set: { activeChildId: childProfile._id } }
    ).session(session);
  }

  return {
    parentCreated,
    emailBackfilled,
    parentName: parentUser.name,
    parentEmail: parentUser.email || normalizedEmail,
    parentPhone: normalizedPhone,
    schoolName: schoolObj ? schoolObj.name : '',
  };
};

// Fire-and-forget after the transaction commits — a failed email must never
// roll back an enrollment
const sendParentWelcomeEmail = (linkResult) => {
  if (!linkResult || (!linkResult.parentCreated && !linkResult.emailBackfilled) || !linkResult.parentEmail) return;
  const emailService = require('../../../common/email');
  const logger = require('../../../common/logger');
  emailService.sendWelcomeEmail({
    to: linkResult.parentEmail,
    name: linkResult.parentName,
    role: 'parent',
    mobile: linkResult.parentPhone,
    schoolName: linkResult.schoolName,
  }).catch((err) => {
    logger.error('Failed to send parent welcome email:', err);
  });
};

const studentService = {
  async registerStudent(schoolId, payload) {
    const Student = require('../../../database/models/Student');

    // The (schoolId, schoolRefNo) unique index also covers soft-deleted
    // students, so both the duplicate check and the sequence generation must
    // query the raw model rather than the soft-delete-filtered repository
    let schoolRefNo = payload.schoolRefNo;
    if (schoolRefNo) {
      const existing = await Student.findOne({ schoolId, schoolRefNo }).lean();
      if (existing) throw new ConflictError('Student reference already exists', 'STUDENT_REF_EXISTS');
    } else {
      const total = await Student.countDocuments({ schoolId });
      let sequence = total + 1;
      schoolRefNo = generateStudentRefNo(schoolId, sequence);
      // eslint-disable-next-line no-await-in-loop
      while (await Student.findOne({ schoolId, schoolRefNo }).lean()) {
        sequence += 1;
        schoolRefNo = generateStudentRefNo(schoolId, sequence);
      }
    }

    try {
      let linkResult;
      const student = await withTransaction(async (session) => {
        const created = await studentRepository.create(
          {
            schoolId,
            name: payload.name,
            schoolRefNo,
            rollNo: payload.rollNo,
            classGrade: payload.classGrade,
            section: payload.section,
            admissionNo: payload.admissionNo,
            status: payload.status || 'active',
            dob: payload.dob,
            gender: payload.gender,
            bloodGroup: payload.bloodGroup,
            motherName: payload.motherName,
            address: payload.address,
            admissionDate: payload.admissionDate,
            previousSchool: payload.previousSchool,
            parentProfileIds: payload.parentProfileIds || [],
          },
          { session }
        );

        if (payload.parentPhone) {
          linkResult = await linkParentByPhone(schoolId, created, payload, session);
        }

        if (payload.parentUserId) {
          const parentProfile = await schoolUserRepository.findParentProfileByUserId(payload.parentUserId);
          if (parentProfile) {
            await studentRepository.updateById(
              created._id,
              { $addToSet: { parentProfileIds: parentProfile._id } },
              {},
              { session }
            );
          }
        }

        return created;
      });

      sendParentWelcomeEmail(linkResult);
      return student;
    } catch (err) {
      // Concurrent registrations can still race on the unique index
      if (err?.code === 11000) {
        throw new ConflictError('Student reference already exists', 'STUDENT_REF_EXISTS');
      }
      throw err;
    }
  },

  async listStudents(schoolId, query) {
    const filter = { schoolId };
    if (query.classGrade) filter.classGrade = query.classGrade;
    if (query.section) filter.section = query.section;
    if (query.status) filter.status = query.status;
    const { data, pagination } = await studentRepository.paginateStudents(filter, query);

    const Student = require('../../../database/models/Student');
    const populatedData = await Student.populate(data, [
      { path: 'parentProfileIds', populate: { path: 'userId', select: 'name phone email' } }
    ]);

    return { data: populatedData, pagination };
  },

  async getStudent(schoolId, studentId) {
    const student = await studentRepository.findOne({ _id: studentId, schoolId });
    if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    const Student = require('../../../database/models/Student');
    return Student.populate(student, [
      { path: 'parentProfileIds', populate: { path: 'userId', select: 'name phone email' } }
    ]);
  },

  async updateStudent(schoolId, studentId, payload) {
    let linkResult;
    const result = await withTransaction(async (session) => {
      const student = await studentRepository.findOne({ _id: studentId, schoolId }).session(session);
      if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');

      const updateFields = { ...payload };
      delete updateFields.parentPhone;
      delete updateFields.parentName;
      delete updateFields.parentEmail;
      // Parent links are managed via linkParentByPhone/associateParent; a raw
      // $set here could silently wipe existing links
      delete updateFields.parentProfileIds;
      delete updateFields.parentUserId;

      await studentRepository.updateById(studentId, { $set: updateFields }, {}, { session });

      // Synchronize changes to any linked ChildProfile records so parents & parent app
      // immediately see updated student name, grade, roll number, etc.
      const ChildProfile = require('../../../database/models/ChildProfile');
      const childSync = {};
      if (updateFields.name !== undefined) childSync.name = updateFields.name;
      if (updateFields.classGrade !== undefined) childSync.grade = updateFields.classGrade;
      if (updateFields.rollNo !== undefined) childSync.rollNo = updateFields.rollNo;
      if (updateFields.dob !== undefined) childSync.dob = updateFields.dob;
      if (updateFields.gender !== undefined) childSync.gender = updateFields.gender;
      if (updateFields.bloodGroup !== undefined) childSync.bloodGroup = updateFields.bloodGroup;

      if (Object.keys(childSync).length > 0) {
        await ChildProfile.updateMany(
          { studentId: student._id, 'softDelete.isDeleted': { $ne: true } },
          { $set: childSync }
        ).session(session);
      }

      if (payload.parentPhone) {
        linkResult = await linkParentByPhone(schoolId, student, payload, session);
      }

      const updated = await studentRepository.findOne({ _id: studentId, schoolId }).session(session);
      const Student = require('../../../database/models/Student');
      return Student.populate(updated, [
        { path: 'parentProfileIds', populate: { path: 'userId', select: 'name phone email' } }
      ]);
    });

    sendParentWelcomeEmail(linkResult);
    return result;
  },

  async transferStudent(schoolId, studentId, { classGrade, section }) {
    return this.updateStudent(schoolId, studentId, { classGrade, section });
  },

  async updateStudentStatus(schoolId, studentId, status) {
    return this.updateStudent(schoolId, studentId, { status });
  },

  async associateParent(schoolId, studentId, parentProfileId) {
    const student = await studentRepository.updateById(
      studentId,
      { $addToSet: { parentProfileIds: parentProfileId } },
      { schoolId }
    );
    if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    return student;
  },

  async deleteStudent(schoolId, studentId, deletedBy) {
    const student = await studentRepository.softDeleteById(studentId, { deletedBy });
    if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    return student;
  },
};

module.exports = studentService;
