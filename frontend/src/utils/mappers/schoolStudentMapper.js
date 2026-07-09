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

// listStudents populates parentProfileIds with the linked parent's user (name, phone)
const firstLinkedParent = (student) => {
  const profiles = Array.isArray(student?.parentProfileIds) ? student.parentProfileIds : [];
  return profiles.find((p) => p?.userId?.name)?.userId || null;
};

export const mapStudentForList = (student) => ({
  id: student?.schoolRefNo || student?._id?.toString?.(),
  mongoId: student?._id?.toString?.() || student?.id,
  name: student?.name,
  class: `Class ${student?.classGrade}${student?.section ? `-${student.section}` : ''}`,
  classGrade: student?.classGrade,
  section: student?.section,
  rollNo: student?.rollNo || '—',
  gender: formatGender(student?.gender),
  parent: firstLinkedParent(student)?.name || '—',
  parentPhone: firstLinkedParent(student)?.phone || '—',
  parentEmail: '—',
  status: formatStatus(student?.status),
  statusRaw: student?.status || 'active',
  avatar: student?.avatarUrl || null,
  dob: student?.dob ? formatOrderDateShort(student.dob) : '—',
  bloodGroup: student?.bloodGroup || '—',
  attendance: '—',
  fees: '—',
  raw: student,
});
