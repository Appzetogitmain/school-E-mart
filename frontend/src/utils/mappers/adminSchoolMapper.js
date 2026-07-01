import { formatOrderDateShort } from './orderMapper';

const PARTNER_STATUS_LABELS = {
  prospect: 'Pending',
  active: 'Active',
  suspended: 'Suspended',
};

export const mapAdminSchoolForList = (school) => {
  const partnerStatus = school?.partnerStatus || 'prospect';
  const address = school?.address || {};

  return {
    id: school?.schoolRefNo || school?._id?.toString?.() || school?.id,
    mongoId: school?._id?.toString?.() || school?.id,
    name: school?.name || '—',
    code: school?.code || '—',
    principalName: school?.principalName || '—',
    adminEmail: school?.adminEmail || '—',
    city: address.city || '—',
    state: address.state || '—',
    addressLine: [address.line1, address.city, address.state, address.pinCode]
      .filter(Boolean)
      .join(', ') || '—',
    gradesCount: school?.gradesOffered?.length || 0,
    classesCount: school?.sectionsConfig?.length || 0,
    academicYear: school?.academicYearCurrent || '—',
    status: PARTNER_STATUS_LABELS[partnerStatus] || 'Pending',
    statusRaw: partnerStatus,
    registeredOn: school?.audit?.createdAt
      ? formatOrderDateShort(school.audit.createdAt)
      : '—',
    raw: school,
  };
};
