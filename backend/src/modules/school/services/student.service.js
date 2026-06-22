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
          status: payload.status || 'active',
          dob: payload.dob,
          gender: payload.gender,
          bloodGroup: payload.bloodGroup,
          parentProfileIds: payload.parentProfileIds || [],
        },
        { session }
      );

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
    return studentRepository.paginateStudents(filter, query);
  },

  async getStudent(schoolId, studentId) {
    const student = await studentRepository.findOne({ _id: studentId, schoolId });
    if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    return student;
  },

  async updateStudent(schoolId, studentId, payload) {
    const student = await studentRepository.updateById(studentId, { $set: payload }, { schoolId });
    if (!student) throw new NotFoundError('Student not found', 'STUDENT_NOT_FOUND');
    return student;
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
