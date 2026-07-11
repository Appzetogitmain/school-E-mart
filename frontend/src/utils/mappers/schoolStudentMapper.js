import { formatOrderDateShort } from './orderMapper';

const formatGender = (gender) => {
  if (gender === 'female') return 'Girl';
  if (gender === 'male') return 'Boy';
  return '—';
};

const formatStatus = (status) => {
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Inactive';
  if (status === 'alumni') return 'Alumni';
  return 'Active';
};

// listStudents populates parentProfileIds with the linked parent's user (name, phone, email)
const firstLinkedParent = (student) => {
  const profiles = Array.isArray(student?.parentProfileIds) ? student.parentProfileIds : [];
  return profiles.find((p) => p?.userId?.name)?.userId || null;
};

// classGrade is free text ("5" or "Class 5"); avoid rendering "Class Class 5"
export const formatClassLabel = (classGrade) => {
  const value = String(classGrade || '').trim();
  if (!value) return '—';
  return /^(class|grade|std)\b/i.test(value) ? value : `Class ${value}`;
};

// Age in completed years from date of birth
export const calculateAge = (dob) => {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

export const mapStudentForList = (student) => ({
  id: student?.schoolRefNo || student?._id?.toString?.(),
  mongoId: student?._id?.toString?.() || student?.id,
  name: student?.name,
  class: `${formatClassLabel(student?.classGrade)}${student?.section ? `-${student.section}` : ''}`,
  classGrade: student?.classGrade,
  section: student?.section,
  rollNo: student?.rollNo || '—',
  gender: formatGender(student?.gender),
  parent: firstLinkedParent(student)?.name || '—',
  parentPhone: firstLinkedParent(student)?.phone || '—',
  parentEmail: firstLinkedParent(student)?.email || '—',
  status: formatStatus(student?.status),
  statusRaw: student?.status || 'active',
  avatar: student?.avatarUrl || null,
  dob: student?.dob ? formatOrderDateShort(student.dob) : '—',
  age: calculateAge(student?.dob),
  bloodGroup: student?.bloodGroup || '—',
  motherName: student?.motherName || '—',
  address: student?.address || '—',
  admissionDate: student?.admissionDate ? formatOrderDateShort(student.admissionDate) : '—',
  previousSchool: student?.previousSchool || '—',
  attendance: '—',
  fees: '—',
  raw: student,
});
