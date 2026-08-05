import { formatOrderDateShort } from './orderMapper';
import { toAbsoluteUrl } from '../url';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

// Maps the cross-school admin teacher list (teacherManagement.service.js#listTeachers)
// for the superadmin's Teacher Management table.
export const mapTeacherForAdmin = (teacher) => ({
  id: teacher?._id || teacher?.id,
  mongoId: teacher?._id?.toString?.() || teacher?.id,
  name: teacher?.user?.name || 'Teacher',
  phone: teacher?.user?.phone || '—',
  email: teacher?.user?.email || '—',
  schoolId: teacher?.schoolId?.toString?.() || teacher?.schoolId || '',
  schoolName: teacher?.school?.name || 'Unknown School',
  schoolRefNo: teacher?.school?.schoolRefNo || '',
  subjects: Array.isArray(teacher?.subjectsTaught) && teacher.subjectsTaught.length
    ? teacher.subjectsTaught.join(', ')
    : '—',
  subjectsList: teacher?.subjectsTaught || [],
  designation: teacher?.designation || '—',
  department: teacher?.department || '—',
  qualification: teacher?.qualification || '—',
  experience: teacher?.experienceYears ? `${teacher.experienceYears} Years` : '—',
  employeeId: teacher?.employeeId || '—',
  status: STATUS_LABELS[teacher?.approvalStatus] || 'Pending',
  statusRaw: teacher?.approvalStatus || 'pending',
  avatar: toAbsoluteUrl(teacher?.avatarUrl || teacher?.user?.avatarUrl) || '',
  joinedOn: teacher?.audit?.createdAt ? formatOrderDateShort(teacher.audit.createdAt) : '—',
  raw: teacher,
});
