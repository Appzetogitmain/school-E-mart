import { formatOrderDateShort } from './orderMapper';

const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const mapTeacherForApproval = (teacher) => ({
  id: teacher?.employeeId || teacher?.user?.refId || teacher?._id?.toString?.()?.slice(-6),
  mongoId: teacher?._id?.toString?.() || teacher?.id,
  name: teacher?.user?.name || 'Teacher',
  phone: teacher?.user?.phone || '—',
  email: teacher?.user?.email || '—',
  date: teacher?.audit?.createdAt
    ? `Requested on ${formatOrderDateShort(teacher.audit.createdAt)}`
    : '—',
  status: STATUS_LABELS[teacher?.approvalStatus] || 'Pending',
  statusRaw: teacher?.approvalStatus || 'pending',
  avatar: teacher?.avatarUrl || teacher?.user?.avatarUrl || null,
  designation: teacher?.designation || 'Teacher',
  department: teacher?.department || '—',
  qualifications: teacher?.qualification || '—',
  experience: teacher?.experienceYears
    ? `${teacher.experienceYears} Years`
    : '—',
  refCode: teacher?.user?.refId || '—',
  raw: teacher,
});

export const mapTeacherForSelect = (teacher) => ({
  id: teacher?._id?.toString?.(),
  label: teacher?.user?.name || teacher?.designation || 'Teacher',
});
