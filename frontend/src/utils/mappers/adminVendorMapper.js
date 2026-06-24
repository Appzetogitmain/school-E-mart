const APPROVAL_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  suspended: 'Suspended',
};

export const mapAdminVendorForList = (vendor) => {
  const user = vendor?.user || {};
  const approvalStatus = vendor?.approvalStatus || 'pending';

  return {
    id: vendor?._id?.toString?.() || vendor?.id,
    mongoId: vendor?._id?.toString?.() || vendor?.id,
    name: user?.name || vendor?.storeName || 'Vendor',
    storeName: vendor?.storeName || '—',
    phone: user?.phone || '—',
    email: user?.email || '—',
    category: vendor?.primaryCategory || vendor?.categoryName || '—',
    balance: ((vendor?.walletBalancePaise || 0) / 100).toFixed(2),
    commission: `${vendor?.commissionPercent ?? 10}.00%`,
    categoriesCount: vendor?.categoriesCount || 0,
    status: APPROVAL_LABELS[approvalStatus] || 'Pending',
    statusRaw: approvalStatus,
    needApproval: approvalStatus === 'pending' ? 'Yes' : 'No',
    address: vendor?.address?.line1 || vendor?.address || '—',
    city: vendor?.address?.city || '—',
    serviceableArea: vendor?.serviceableArea || '—',
    latitude: vendor?.location?.coordinates?.[1]?.toString?.() || '',
    longitude: vendor?.location?.coordinates?.[0]?.toString?.() || '',
    serviceRadius: String(vendor?.serviceRadiusKm || 7),
    panCard: vendor?.panNumber || '—',
    taxName: vendor?.gstLegalName || vendor?.storeName || '—',
    taxNumber: vendor?.gstin || '—',
    accountName: vendor?.bankDetails?.accountName || '—',
    bankName: vendor?.bankDetails?.bankName || '—',
    branch: vendor?.bankDetails?.branch || '—',
    accountNumber: vendor?.bankDetails?.accountNumber || '—',
    ifscCode: vendor?.bankDetails?.ifsc || '—',
    raw: vendor,
  };
};
