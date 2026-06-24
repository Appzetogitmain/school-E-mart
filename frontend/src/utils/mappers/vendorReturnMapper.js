import { formatOrderDateShort, paiseToRupees } from './orderMapper';

const RETURN_STATUS_LABELS = {
  requested: 'Requested',
  approved: 'Approved',
  qc_passed: 'QC Passed',
  pickup_assigned: 'Pickup Assigned',
  in_transit: 'In Transit',
  rejected: 'Rejected',
  completed: 'Completed',
};

export const formatReturnStatus = (status = '') =>
  RETURN_STATUS_LABELS[status] ||
  String(status || 'requested')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const mapVendorReturnForList = (returnRequest) => ({
  id: returnRequest?.returnNumber || returnRequest?._id?.toString?.()?.slice(-8)?.toUpperCase(),
  mongoId: returnRequest?._id?.toString?.() || returnRequest?.id,
  product: returnRequest?.productSnapshot?.name || 'Product',
  customer: returnRequest?.userName || 'Customer',
  reason: returnRequest?.reason || '—',
  status: formatReturnStatus(returnRequest?.status),
  statusRaw: returnRequest?.status,
  qcStatus: returnRequest?.qcStatus || 'pending',
  amount: paiseToRupees(
    (returnRequest?.productSnapshot?.pricePaise || 0) *
      (returnRequest?.productSnapshot?.quantity || 1)
  ),
  refundVal: paiseToRupees(
    (returnRequest?.productSnapshot?.pricePaise || 0) *
      (returnRequest?.productSnapshot?.quantity || 1)
  ),
  quantity: returnRequest?.productSnapshot?.quantity || 1,
  code: returnRequest?.productSnapshot?.sku || '—',
  variant: returnRequest?.productSnapshot?.size || 'Standard',
  date: formatOrderDateShort(returnRequest?.audit?.createdAt),
  orderId: returnRequest?.orderId?.toString?.() || returnRequest?.orderId,
  raw: returnRequest,
});

export const getReturnSegmentCounts = (returns = []) => ({
  requested: returns.filter((r) => r.statusRaw === 'requested').length,
  approved: returns.filter((r) =>
    ['approved', 'qc_passed', 'pickup_assigned', 'in_transit'].includes(r.statusRaw)
  ).length,
  rejected: returns.filter((r) => r.statusRaw === 'rejected').length,
  completed: returns.filter((r) => r.statusRaw === 'completed').length,
});
