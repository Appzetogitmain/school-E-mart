import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildChildInfoFromUser, normalizeUser } from './mappers/userMapper.js';
import { isSchoolLinked } from './schoolLinked.js';

test('unlinked parent does NOT leak student photo, grade, rollNo, or studentId from previous localStorage session', () => {
  const staleExistingFromPreviousStudent = {
    userId: 'prev-user-id-123',
    name: 'Akashara niraj kadu',
    phone: '8888888888',
    photo: 'https://cdn.example.com/uploads/student-uniform-photo.jpg',
    grade: 'NURSERY',
    rollNo: '12',
    studentId: 'student-id-999',
    schoolId: 'school-id-456',
    school: 'SMART EDUKIDZ BRAHMNI',
    schoolRefNo: 'SEM-ADM-352243',
  };

  const currentUnlinkedParentUser = {
    _id: '6a659bb48e97659877677426',
    refId: 'SEM-P-YJE3X7',
    role: 'parent',
    name: 'Parent User',
    phone: '9766017859',
    childProfile: null,
    profile: null,
  };

  const result = buildChildInfoFromUser(currentUnlinkedParentUser, staleExistingFromPreviousStudent);

  // Name should be the parent's name
  assert.equal(result.name, 'Parent User');
  assert.equal(result.phone, '9766017859');
  assert.equal(result.role, 'parent');

  // Must NOT leak student photo from previous session
  assert.equal(result.photo, '');

  // Must NOT leak student academic details from previous session
  assert.equal(result.studentId, null);
  assert.equal(result.rollNo, null);
  assert.equal(result.schoolRefNo, null);
  assert.equal(result.grade, 'Select Grade');

  // isSchoolLinked must be FALSE for unlinked parent
  assert.equal(isSchoolLinked(result), false);
});

test('linked parent properly maps student name, photo, grade, and rollNo', () => {
  const linkedParentUser = {
    _id: '6a619b5fc02e8ba87de40b8a',
    role: 'parent',
    name: 'Niraj Kadu',
    phone: '9876543210',
    childProfile: {
      _id: '6a619b5fc02e8ba87de40b90',
      name: 'Akashara niraj kadu',
      grade: 'NURSERY',
      studentId: '6a619b5fc02e8ba87de40b89',
      schoolId: '6a6060cdc02e8ba87de40ab4',
      schoolName: 'SMART EDUKIDZ BRAHMNI',
      schoolLogo: '/uploads/school-logo.png',
      rollNo: '5',
      avatarUrl: '/uploads/akashara.jpg',
    },
  };

  const result = buildChildInfoFromUser(linkedParentUser);

  assert.equal(result.name, 'Akashara niraj kadu');
  assert.equal(result.grade, 'NURSERY');
  assert.equal(result.studentId, '6a619b5fc02e8ba87de40b89');
  assert.equal(result.school, 'SMART EDUKIDZ BRAHMNI');
  assert.equal(result.rollNo, '5');
  assert.match(result.photo, /akashara\.jpg/);

  // isSchoolLinked must be TRUE for linked parent
  assert.equal(isSchoolLinked(result), true);
});

test('different user session is ignored even if phone formatting differs', () => {
  const existingOtherPhone = {
    phone: '+91 99999 11111',
    name: 'Other Parent',
    photo: 'https://cdn.example.com/other.jpg',
    studentId: 'other-student',
  };

  const newUser = {
    _id: 'new-user-id',
    role: 'parent',
    name: 'New Parent User',
    phone: '9766017859',
    childProfile: null,
  };

  const result = buildChildInfoFromUser(newUser, existingOtherPhone);

  assert.equal(result.name, 'New Parent User');
  assert.equal(result.phone, '9766017859');
  assert.equal(result.studentId, null);
  assert.equal(result.photo, '');
  assert.equal(isSchoolLinked(result), false);
});

test('guest browsing preserves chosen school/grade when guest is not authenticated', () => {
  const guestExisting = {
    school: 'Delhi Public School',
    schoolId: 'dps-123',
    grade: 'Class 5',
  };

  const guestUser = null;
  const result = buildChildInfoFromUser(guestUser, guestExisting);

  assert.equal(result.name, 'Guest');
  assert.equal(result.school, 'Delhi Public School');
  assert.equal(result.grade, 'Class 5');
  assert.equal(result.studentId, null);
  assert.equal(isSchoolLinked(result), false);
});

test('parent with own profile avatar gets their own photo, not student photo', () => {
  const parentWithAvatar = {
    _id: 'parent-with-pic',
    role: 'parent',
    name: 'Rajesh Sharma',
    phone: '9876500000',
    profile: {
      avatarUrl: '/uploads/parent-rajesh.jpg',
    },
    childProfile: null,
  };

  const result = buildChildInfoFromUser(parentWithAvatar);

  assert.equal(result.name, 'Rajesh Sharma');
  assert.match(result.photo, /parent-rajesh\.jpg/);
  assert.equal(result.studentId, null);
  assert.equal(result.rollNo, null);
  assert.equal(isSchoolLinked(result), false);
});
