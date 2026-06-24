const { NotFoundError, ConflictError } = require('../../../common/errors');
const { withTransaction } = require('../../../database');
const studentRepository = require('../repositories/student.repository');
const schoolUserRepository = require('../repositories/user.repository');
const { generateStudentRefNo } = require('../utils/refId');

const studentService = {
  async registerStudent(schoolId, payload) {
    const count = await studentRepository.countBySchool(schoolId);
    const schoolRefNo = payload.schoolRefNo || generateStudentRefNo(schoolId, count + 1);

    const existing = await studentRepository.findBySchoolRefNo(schoolId, schoolRefNo);
    if (existing) throw new ConflictError('Student reference already exists', 'STUDENT_REF_EXISTS');

    return withTransaction(async (session) => {
      const student = await studentRepository.create(
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
          parentProfileIds: payload.parentProfileIds || [],
        },
        { session }
      );

      if (payload.parentPhone) {
        const { normalizePhone } = require('../../../utils');
        const User = require('../../../database/models/User');
        const ParentProfile = require('../../../database/models/ParentProfile');
        const ChildProfile = require('../../../database/models/ChildProfile');
        const School = require('../../../database/models/School');
        const { generateUserRefId } = require('../utils/refId');

        const normalizedPhone = normalizePhone(payload.parentPhone);
        
        let parentUser = await User.findOne({ phone: normalizedPhone, role: 'parent', 'softDelete.isDeleted': { $ne: true } }).session(session);
        let parentProfile;
        
        if (parentUser) {
          parentProfile = await ParentProfile.findOne({ userId: parentUser._id, 'softDelete.isDeleted': { $ne: true } }).session(session);
          if (!parentProfile) {
            const referralCode = 'EMART' + Math.floor(1000 + Math.random() * 9000);
            const createdProfile = await ParentProfile.create([{
              userId: parentUser._id,
              referralCode
            }], { session });
            parentProfile = createdProfile[0];
          }
        } else {
          // Create user
          const refId = generateUserRefId('P');
          const pName = payload.parentName || `${payload.name} Parent`;
          const createdUser = await User.create([{
            refId,
            role: 'parent',
            status: 'active',
            name: pName,
            phone: normalizedPhone,
            phoneVerifiedAt: new Date()
          }], { session });
          parentUser = createdUser[0];

          const referralCode = 'EMART' + Math.floor(1000 + Math.random() * 9000);
          const createdProfile = await ParentProfile.create([{
            userId: parentUser._id,
            referralCode
          }], { session });
          parentProfile = createdProfile[0];
        }

        // Link parent to student
        if (parentProfile) {
          await studentRepository.updateById(
            student._id,
            { $addToSet: { parentProfileIds: parentProfile._id } },
            {},
            { session }
          );
        }

        // Link student to parent child profile
        const schoolObj = await School.findById(schoolId).session(session);
        const schoolRefNoVal = schoolObj ? schoolObj.schoolRefNo : '';
        
        let childProfile = await ChildProfile.findOne({ parentUserId: parentUser._id, studentId: student._id, 'softDelete.isDeleted': { $ne: true } }).session(session);
        if (!childProfile) {
          const createdChild = await ChildProfile.create([{
            parentUserId: parentUser._id,
            name: student.name,
            schoolId,
            schoolRefNo: schoolRefNoVal,
            grade: student.classGrade,
            rollNo: student.rollNo,
            studentId: student._id
          }], { session });
          childProfile = createdChild[0];
        } else {
          await ChildProfile.updateOne(
            { _id: childProfile._id },
            { $set: { name: student.name, grade: student.classGrade, rollNo: student.rollNo, schoolId, schoolRefNo: schoolRefNoVal } }
          ).session(session);
        }

        // Set activeChildId if not set
        if (parentProfile && !parentProfile.activeChildId) {
          await ParentProfile.updateOne(
            { _id: parentProfile._id },
            { $set: { activeChildId: childProfile._id } }
          ).session(session);
        }
      }

      if (payload.parentUserId) {
        const parentProfile = await schoolUserRepository.findParentProfileByUserId(payload.parentUserId);
        if (parentProfile) {
          await studentRepository.updateById(
            student._id,
            { $addToSet: { parentProfileIds: parentProfile._id } },
            {},
            { session }
          );
        }
      }

      return student;
    });
  },

  async listStudents(schoolId, query) {
    const filter = { schoolId };
    if (query.classGrade) filter.classGrade = query.classGrade;
    if (query.section) filter.section = query.section;
    if (query.status) filter.status = query.status;
    const { data, pagination } = await studentRepository.paginateStudents(filter, query);

    const Student = require('../../../database/models/Student');
    const populatedData = await Student.populate(data, [
      { path: 'parentProfileIds', populate: { path: 'userId', select: 'name phone' } }
    ]);

    return { data: populatedData, pagination };
  },

  async getStudent(schoolId, studentId) {
    const student = await studentRepository.findOne({ _id: studentId, schoolId });
    if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    const Student = require('../../../database/models/Student');
    return Student.populate(student, [
      { path: 'parentProfileIds', populate: { path: 'userId', select: 'name phone' } }
    ]);
  },

  async updateStudent(schoolId, studentId, payload) {
    return withTransaction(async (session) => {
      const student = await studentRepository.findOne({ _id: studentId, schoolId }).session(session);
      if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');

      const updateFields = { ...payload };
      delete updateFields.parentPhone;
      delete updateFields.parentName;

      await studentRepository.updateById(studentId, { $set: updateFields }, {}, { session });

      if (payload.parentPhone) {
        const { normalizePhone } = require('../../../utils');
        const User = require('../../../database/models/User');
        const ParentProfile = require('../../../database/models/ParentProfile');
        const ChildProfile = require('../../../database/models/ChildProfile');
        const School = require('../../../database/models/School');
        const { generateUserRefId } = require('../utils/refId');

        const normalizedPhone = normalizePhone(payload.parentPhone);
        
        let parentUser = await User.findOne({ phone: normalizedPhone, role: 'parent', 'softDelete.isDeleted': { $ne: true } }).session(session);
        let parentProfile;
        
        if (parentUser) {
          parentProfile = await ParentProfile.findOne({ userId: parentUser._id, 'softDelete.isDeleted': { $ne: true } }).session(session);
          if (!parentProfile) {
            const referralCode = 'EMART' + Math.floor(1000 + Math.random() * 9000);
            const createdProfile = await ParentProfile.create([{
              userId: parentUser._id,
              referralCode
            }], { session });
            parentProfile = createdProfile[0];
          }
        } else {
          // Create user
          const refId = generateUserRefId('P');
          const pName = payload.parentName || `${payload.name || student.name} Parent`;
          const createdUser = await User.create([{
            refId,
            role: 'parent',
            status: 'active',
            name: pName,
            phone: normalizedPhone,
            phoneVerifiedAt: new Date()
          }], { session });
          parentUser = createdUser[0];

          const referralCode = 'EMART' + Math.floor(1000 + Math.random() * 9000);
          const createdProfile = await ParentProfile.create([{
            userId: parentUser._id,
            referralCode
          }], { session });
          parentProfile = createdProfile[0];
        }

        // Link parent to student
        if (parentProfile) {
          await studentRepository.updateById(
            studentId,
            { $addToSet: { parentProfileIds: parentProfile._id } },
            {},
            { session }
          );
        }

        // Link student to parent child profile
        const schoolObj = await School.findById(schoolId).session(session);
        const schoolRefNo = schoolObj ? schoolObj.schoolRefNo : '';
        
        let childProfile = await ChildProfile.findOne({ parentUserId: parentUser._id, studentId, 'softDelete.isDeleted': { $ne: true } }).session(session);
        if (!childProfile) {
          const createdChild = await ChildProfile.create([{
            parentUserId: parentUser._id,
            name: payload.name || student.name,
            schoolId,
            schoolRefNo,
            grade: payload.classGrade || student.classGrade,
            rollNo: payload.rollNo || student.rollNo,
            studentId
          }], { session });
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
                schoolRefNo 
              } 
            }
          ).session(session);
        }

        // Set activeChildId if not set
        if (parentProfile && !parentProfile.activeChildId) {
          await ParentProfile.updateOne(
            { _id: parentProfile._id },
            { $set: { activeChildId: childProfile._id } }
          ).session(session);
        }
      }

      const updated = await studentRepository.findOne({ _id: studentId, schoolId }).session(session);
      const Student = require('../../../database/models/Student');
      return Student.populate(updated, [
        { path: 'parentProfileIds', populate: { path: 'userId', select: 'name phone' } }
      ]);
    });
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
