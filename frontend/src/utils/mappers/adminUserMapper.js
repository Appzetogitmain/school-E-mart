import { formatOrderDate } from './orderMapper';

const formatStatus = (status) => {
  if (status === 'active') return 'Active';
  if (status === 'inactive') return 'Inactive';
  if (status === 'suspended') return 'Suspended';
  if (status === 'locked') return 'Locked';
  if (status === 'pending_approval') return 'Pending';
  return status || 'Active';
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
  raw: user,
});
