const mapVendorDisplayStatus = (profile, user = {}) => {
  if (!profile) return 'pending';
  if (profile.approvalStatus === 'approved') return 'approved';
  if (profile.approvalStatus === 'suspended') {
    return user.status === 'inactive' ? 'rejected' : 'suspended';
  }
  if (profile.kycDocs?.length > 0) return 'under_review';
  return 'pending';
};

const VENDOR_STATUS_FILTERS = {
  pending: { approvalStatus: 'pending', hasKycDocs: false },
  under_review: { approvalStatus: 'pending', hasKycDocs: true },
  approved: { approvalStatus: 'approved' },
  suspended: { approvalStatus: 'suspended', userStatus: { $ne: 'inactive' } },
  rejected: { approvalStatus: 'suspended', userStatus: 'inactive' },
};

module.exports = {
  mapVendorDisplayStatus,
  VENDOR_STATUS_FILTERS,
};
