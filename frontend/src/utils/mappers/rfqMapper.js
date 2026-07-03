const formatDisplayDate = (isoDate) => {
  if (!isoDate) return '—';
  return new Date(isoDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const mapSchoolRfqStatus = (rfq) => {
  const deadlinePassed =
    rfq.quotationDeadline && new Date(rfq.quotationDeadline) < new Date();

  if (rfq.status === 'awarded') {
    return {
      status: 'Awarded',
      badgeText: 'Contract Awarded',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-100',
      dotColor: 'bg-blue-500',
    };
  }

  if (['closed', 'cancelled'].includes(rfq.status) || deadlinePassed) {
    return {
      status: 'Expired',
      badgeText: 'Expired',
      badgeColor: 'bg-rose-50 text-rose-600 border-rose-100',
      dotColor: 'bg-rose-500',
    };
  }

  if ((rfq.quoteCount || 0) > 0) {
    return {
      status: 'Received',
      badgeText: 'Quotes Received',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      dotColor: 'bg-emerald-500',
    };
  }

  return {
    status: 'Pending',
    badgeText: 'Awaiting Quotes',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
    dotColor: 'bg-amber-500',
  };
};

export const mapSchoolRfqForList = (rfq) => {
  const statusMeta = mapSchoolRfqStatus(rfq);

  return {
    id: rfq._id,
    rfqNumber: rfq.rfqNumber,
    title: rfq.title,
    ...statusMeta,
    iconType: 'uniform',
    iconBg: 'bg-purple-50',
    deadline: formatDisplayDate(rfq.quotationDeadline),
    vendorsInvited: rfq.invitedCount || rfq.invitedVendorIds?.length || 0,
    quotesReceived: rfq.quoteCount || 0,
    createdDate: formatDisplayDate(rfq.createdAt),
    quotes: (rfq.quotes || []).map(mapSchoolQuoteForCompare),
    raw: rfq,
  };
};

export const mapSchoolQuoteForCompare = (quote) => ({
  quoteId: quote._id,
  vendorName: quote.vendorName || 'Vendor',
  rating: Number(quote.rating || 0).toFixed(1),
  pricePerUnit: quote.items?.[0]?.unitPrice ? `₹${quote.items[0].unitPrice}` : '—',
  totalAmount: quote.total ? `₹${quote.total}` : '—',
  deliveryDays: quote.deliveryTimeline || '—',
  material: quote.termsAndConditions || '—',
  remarks: quote.items?.[0]?.remarks || quote.termsAndConditions || '—',
  raw: quote,
});

export const mapVendorRfqStatus = (rfq) => {
  const vendorQuote = rfq.vendorQuote;

  if (rfq.status === 'awarded') {
    if (vendorQuote?.status === 'accepted') {
      return {
        status: 'Awarded',
        statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
        statusBullet: 'bg-emerald-500',
      };
    }
    return {
      status: 'Rejected',
      statusColor: 'bg-red-50 text-red-700 border-red-100',
      statusBullet: 'bg-red-500',
    };
  }

  if (vendorQuote) {
    if (vendorQuote.status === 'rejected') {
      return {
        status: 'Rejected',
        statusColor: 'bg-red-50 text-red-700 border-red-100',
        statusBullet: 'bg-red-500',
      };
    }
    return {
      status: 'Submitted',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-100',
      statusBullet: 'bg-blue-500',
    };
  }

  return {
    status: 'Pending',
    statusColor: 'bg-amber-50 text-amber-700 border-amber-100',
    statusBullet: 'bg-amber-500',
  };
};

const LOGO_PALETTE = [
  'bg-purple-100 text-purple-700',
  'bg-indigo-100 text-indigo-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
];

export const mapVendorRfqForList = (rfq) => {
  const statusMeta = mapVendorRfqStatus(rfq);
  const schoolInitial = (rfq.schoolName || 'S').charAt(0).toUpperCase();
  const hash = String(rfq._id).split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);

  return {
    id: rfq.rfqNumber || rfq._id,
    rfqId: rfq._id,
    date: formatDisplayDate(rfq.createdAt),
    school: rfq.schoolName || 'School',
    location: rfq.location || '—',
    requirement: rfq.title,
    subRequirement: rfq.category || 'Uniform',
    classes: (rfq.classes || []).join(', ') || '—',
    deadline: formatDisplayDate(rfq.quotationDeadline),
    daysLeft: rfq.daysLeft || '—',
    logoLetter: schoolInitial,
    logoBg: LOGO_PALETTE[hash % LOGO_PALETTE.length],
    items: (rfq.items || []).map((item) => ({
      name: item.name,
      qty: item.quantity,
      estPrice: 0,
    })),
    vendorQuote: rfq.vendorQuote,
    ...statusMeta,
    raw: rfq,
  };
};

export const buildCreateRfqPayload = ({
  requestTitle,
  academicYear,
  requiredDate,
  deadlineDate,
  selectedClasses,
  totalStudents,
  specialInstructions,
  additionalNotes,
  uniformSets,
  vendors,
  status = 'open',
}) => ({
  title: requestTitle,
  academicYear: academicYear || undefined,
  requiredDate: requiredDate || undefined,
  quotationDeadline: deadlineDate || undefined,
  classes: selectedClasses,
  totalStudents: totalStudents || undefined,
  specialInstructions: specialInstructions || undefined,
  additionalNotes: additionalNotes || undefined,
  uniformSets,
  invitedVendorIds: vendors.filter((v) => v.checked).map((v) => v.id),
  status,
});
