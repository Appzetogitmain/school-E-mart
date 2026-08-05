import { formatOrderDate } from './orderMapper';

const formatStatus = (status) => {
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Inactive';
  if (status === 'suspended') return 'Suspended';
  if (status === 'locked') return 'Locked';
  if (status === 'pending_approval') return 'Pending';
  return status || 'Active';
};

// A parent's own `name` doesn't always identify the row to a school — the
// linked student does. `children` is attached server-side for parent-role
// rows only (userManagement.service.js#listUsers, batched, not per-row).
const formatStudentName = (children) => {
  if (!Array.isArray(children) || !children.length) return '—';
  const first = children[0].name || 'Unnamed';
  return children.length > 1 ? `${first} +${children.length - 1} more` : first;
};

export const mapAdminUserForList = (user) => ({
  id: user?._id?.toString?.() || user?.id,
  mongoId: user?._id?.toString?.() || user?.id,
  name: user?.name || 'User',
  email: user?.email || '—',
  phone: user?.phone || '—',
  registrationDate: formatOrderDate(user?.audit?.createdAt),
  status: formatStatus(user?.status),
  statusRaw: user?.status || 'active',
  refCode: user?.refId || '—',
  walletAmt: 0,
  totalOrders: 0,
  totalSpent: 0,
  role: user?.role,
  studentName: user?.role === 'parent' ? formatStudentName(user?.children) : '—',
  raw: user,
});
