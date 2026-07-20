/**
 * A school's display status is not a single stored field. `partnerStatus` has no
 * 'rejected' value, so a rejection is recorded as partnerStatus 'prospect' plus an
 * inactive admin user — the same shape the vendor module uses for its own
 * rejected state. Resolve the two here: without this a rejected school is
 * indistinguishable from a brand new one, so it sits in the Pending tab waiting
 * to be approved again.
 */
const mapSchoolDisplayStatus = (school, adminUser = {}) => {
  if (!school) return 'pending';
  if (school.partnerStatus === 'active') return 'active';
  if (school.partnerStatus === 'suspended') return 'suspended';
  return adminUser?.status === 'inactive' ? 'rejected' : 'pending';
};

/**
 * The inverse of the mapping above, for filtering a list by display status.
 * `adminUserStatus` is not a School field — callers resolve it against the
 * school's admin User before applying the filter.
 */
const SCHOOL_STATUS_FILTERS = {
  pending: { partnerStatus: 'prospect', adminUserStatus: { $ne: 'inactive' } },
  rejected: { partnerStatus: 'prospect', adminUserStatus: 'inactive' },
  active: { partnerStatus: 'active' },
  suspended: { partnerStatus: 'suspended' },
};

module.exports = {
  mapSchoolDisplayStatus,
  SCHOOL_STATUS_FILTERS,
};
