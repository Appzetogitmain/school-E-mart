// The backend returns a computed `status` ('pending' | 'under_review' | 'approved'
// | 'suspended' | 'rejected'). 'rejected' is not a stored value: it is
// approvalStatus 'suspended' plus an inactive user, resolved server-side.
const STATUS_LABELS = {
  pending: 'Pending',
  under_review: 'Under Review',
  approved: 'Approved',
  suspended: 'Suspended',
  rejected: 'Rejected',
};

// Decimal128 can still arrive as { $numberDecimal: "10" } from endpoints that
// don't normalize it, so tolerate both shapes.
const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value.$numberDecimal !== undefined) {
    return Number(value.$numberDecimal);
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const addressLine = (address = {}) =>
  [address.line1, address.line2, address.city, address.state, address.pinCode]
    .filter(Boolean)
    .join(', ');

export const mapAdminVendorForList = (vendor) => {
  const user = vendor?.user || {};
  const address = vendor?.address || {};
  const bank = vendor?.bank || {};
  const status = vendor?.status || vendor?.approvalStatus || 'pending';
  const commissionPercent = toNumber(vendor?.commissionPercent, 0);

  return {
    mongoId: vendor?._id?.toString?.() || vendor?.id,
    // These feed edit forms as well as the table, so they stay raw ('' when
    // absent). Rendering a placeholder here once meant the edit form had to strip
    // '—' back out again, and any field that was missed would save a literal dash.
    refId: user?.refId || '',
    name: user?.name || '',
    storeName: vendor?.storeName || '',
    storeSlug: vendor?.storeSlug || '',
    phone: user?.phone || '',
    email: user?.email || '',
    userStatus: user?.status || 'active',

    commissionPercent,
    commissionLabel: `${commissionPercent.toFixed(2)}%`,

    status: STATUS_LABELS[status] || 'Pending',
    statusRaw: status,
    approvalStatus: vendor?.approvalStatus || 'pending',
    needApproval: status === 'pending' || status === 'under_review',

    verifiedBadge: Boolean(vendor?.verifiedBadge),
    ordersCount: vendor?.ordersCount ?? 0,
    rating: toNumber(vendor?.rating, 0),
    categoriesCount: (vendor?.categories || []).length,
    kycDocsCount: (vendor?.kycDocs || []).length,
    // Each doc carries a viewable url resolved from its attachment server-side.
    kycDocs: (vendor?.kycDocs || []).map((doc) => ({
      id: doc?._id?.toString?.() || doc?.attachmentId,
      type: doc?.type || 'other',
      url: doc?.url || null,
      mime: doc?.mime || null,
      sizeBytes: doc?.sizeBytes ?? null,
      scanStatus: doc?.scanStatus || null,
      uploadedAt: doc?.uploadedAt || null,
    })),

    addressLine: addressLine(address),
    address: {
      line1: address.line1 || '',
      line2: address.line2 || '',
      city: address.city || '',
      state: address.state || '',
      country: address.country || 'India',
      pinCode: address.pinCode || '',
    },
    city: address.city || '',
    latitude: vendor?.location?.coordinates?.[1] ?? '',
    longitude: vendor?.location?.coordinates?.[0] ?? '',
    serviceRadiusKm: toNumber(vendor?.serviceRadiusKm, 0),

    panCard: vendor?.panCard || '',
    gstin: vendor?.gstin || '',

    bank: {
      accountName: bank.accountName || '',
      bankName: bank.bankName || '',
      branch: bank.branch || '',
      ifsc: bank.ifsc || '',
    },
    // The account number is stored as a one-way HMAC and is never sent to the
    // client. The API exposes only `accountNumberMasked` when one is on file —
    // reading accountNumberEnc here would always be false.
    hasAccountNumber: Boolean(bank.accountNumberMasked),

    createdAt: vendor?.audit?.createdAt || null,
    raw: vendor,
  };
};
