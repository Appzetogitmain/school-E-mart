const schoolService = require('../../src/modules/school/services/school.service');
const classService = require('../../src/modules/school/services/class.service');

describe('schoolService', () => {
  test('creates, lists, updates, and soft deletes a school', async () => {
    const created = await schoolService.createSchool({
      name: 'Green Valley School',
      schoolRefNo: 'GV-2026-001',
      partnerStatus: 'active',
    });

    expect(created.name).toBe('Green Valley School');
    expect(created.code).toBeTruthy();

    const listed = await schoolService.listSchools({ page: 1, limit: 10 });
    expect(listed.data.length).toBe(1);

    const updated = await schoolService.updateSchool(created._id, {
      principalName: 'Dr. Mehta',
    });
    expect(updated.principalName).toBe('Dr. Mehta');

    await schoolService.deleteSchool(created._id, created._id);

    await expect(schoolService.getSchool(created._id)).rejects.toMatchObject({
      code: 'SCHOOL_NOT_FOUND',
    });
  });

  test('manages classes through school sectionsConfig', async () => {
    const school = await schoolService.createSchool({
      name: 'Class Test School',
      schoolRefNo: 'CLS-001',
    });

    await classService.createClass(school._id, {
      classGrade: 'Class 1',
      sections: ['A', 'B'],
    });

    const classes = await classService.listClasses(school._id);
    expect(classes).toHaveLength(1);
    expect(classes[0].sections).toEqual(expect.arrayContaining(['A', 'B']));
  });

  test('synchronizes school administrator profile updates with user credentials and school document', async () => {
    const User = require('../../src/database/models/User');
    const SchoolStaffProfile = require('../../src/database/models/SchoolStaffProfile');
    const usersService = require('../../src/modules/users/services/users.service');
    const School = require('../../src/database/models/School');

    // 1. Create a school
    const school = await schoolService.createSchool({
      name: 'Sync Test School',
      schoolRefNo: 'SYNC-001',
    });

    // 2. Create a school admin user
    const user = await User.create({
      refId: 'SEM-ADM-1234',
      role: 'school',
      name: 'Original Name',
      email: 'original@school.com',
      phone: '9876543210',
      tenantSchoolId: school._id,
      status: 'active',
    });

    // 3. Create a staff profile
    const staff = await SchoolStaffProfile.create({
      userId: user._id,
      schoolId: school._id,
      designation: 'Administrator',
      permissions: ['*'],
    });

    // 4. Update profile via usersService
    const profileResult = await usersService.updateProfile(user._id, {
      name: 'New Principal Name',
      email: 'newemail@school.com',
      phone: '9988776655',
      altPhone: '8877665544',
      address: '123 New Campus Rd',
      pinCode: '110022',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      photo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    });

    // 5. Verify User document updates
    const updatedUser = await User.findById(user._id);
    expect(updatedUser.name).toBe('New Principal Name');
    expect(updatedUser.email).toBe('newemail@school.com');
    expect(updatedUser.phone).toBe('9988776655');

    // 6. Verify SchoolStaffProfile updates
    const updatedStaff = await SchoolStaffProfile.findOne({ userId: user._id });
    expect(updatedStaff.altPhone).toBe('8877665544');
    expect(updatedStaff.avatarUrl).toContain('/uploads/school-staff-avatar-');

    // 7. Verify School document updates
    const updatedSchool = await School.findById(school._id);
    expect(updatedSchool.principalName).toBe('New Principal Name');
    expect(updatedSchool.adminEmail).toBe('newemail@school.com');
    expect(updatedSchool.address.line1).toBe('123 New Campus Rd');
    expect(updatedSchool.address.pinCode).toBe('110022');
    expect(updatedSchool.address.city).toBe('New Delhi');
    expect(updatedSchool.address.state).toBe('Delhi');
    expect(updatedSchool.address.country).toBe('India');

    // Clean up uploaded test avatar
    const fs = require('fs');
    const path = require('path');
    if (updatedStaff.avatarUrl) {
      const filename = path.basename(updatedStaff.avatarUrl);
      const filepath = path.resolve(__dirname, '../../uploads', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }
  });
});
