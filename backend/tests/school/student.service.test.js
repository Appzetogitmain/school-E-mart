const mongoose = require('mongoose');
const studentService = require('../../src/modules/school/services/student.service');
const Student = require('../../src/database/models/Student');
const ChildProfile = require('../../src/database/models/ChildProfile');

describe('studentService.deleteStudent', () => {
  let schoolId;
  let student;
  let childProfile;

  beforeEach(async () => {
    schoolId = new mongoose.Types.ObjectId().toString();

    student = await Student.create({
      schoolId,
      name: 'Test Student',
      schoolRefNo: `STU-TEST-${Date.now()}`,
      classGrade: 'Class 5',
      section: 'A',
      status: 'active',
    });

    childProfile = await ChildProfile.create({
      schoolId,
      studentId: student._id,
      parentUserId: new mongoose.Types.ObjectId(),
      name: student.name,
      grade: student.classGrade,
      section: student.section,
    });
  });

  test('successfully soft deletes student by Mongo ObjectId and soft deletes linked ChildProfile', async () => {
    const deletedBy = new mongoose.Types.ObjectId().toString();
    const result = await studentService.deleteStudent(schoolId, student._id.toString(), deletedBy);

    expect(result).toBeTruthy();
    expect(result.softDelete.isDeleted).toBe(true);
    expect(result.schoolRefNo).toContain('_deleted_');

    // Verify student is not found by normal query
    const fetched = await Student.findOne({ _id: student._id, 'softDelete.isDeleted': { $ne: true } });
    expect(fetched).toBeNull();

    // Verify linked ChildProfile is soft deleted
    const fetchedChild = await ChildProfile.findOne({ _id: childProfile._id, 'softDelete.isDeleted': { $ne: true } });
    expect(fetchedChild).toBeNull();
  });

  test('successfully soft deletes student by schoolRefNo', async () => {
    const result = await studentService.deleteStudent(schoolId, student.schoolRefNo, null);

    expect(result).toBeTruthy();
    expect(result.softDelete.isDeleted).toBe(true);
  });

  test('allows creating a new student with original schoolRefNo after soft deletion', async () => {
    const originalRefNo = student.schoolRefNo;
    await studentService.deleteStudent(schoolId, student._id.toString(), null);

    const newStudent = await Student.create({
      schoolId,
      name: 'Replacement Student',
      schoolRefNo: originalRefNo,
      classGrade: 'Class 5',
      section: 'A',
      status: 'active',
    });

    expect(newStudent._id).toBeTruthy();
    expect(newStudent.schoolRefNo).toBe(originalRefNo);
  });

  test('throws STUDENT_NOT_FOUND when studentId is invalid or belongs to another school', async () => {
    const otherSchoolId = new mongoose.Types.ObjectId().toString();

    await expect(
      studentService.deleteStudent(otherSchoolId, student._id.toString(), null)
    ).rejects.toMatchObject({
      code: 'STUDENT_NOT_FOUND',
    });

    await expect(
      studentService.deleteStudent(schoolId, 'NON_EXISTENT_ID', null)
    ).rejects.toMatchObject({
      code: 'STUDENT_NOT_FOUND',
    });
  });
});
