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
    // Raw backend status ('open' | 'reviewing' | 'awarded' | 'closed' | 'cancelled'),
    // for logic that needs the real state machine rather than the display label —
    // e.g. deciding whether "Cancel Request" applies.
    rawStatus: rfq.status,
    iconType: 'uniform',
    iconBg: 'bg-purple-50',
    deadline: formatDisplayDate(rfq.quotationDeadline),
    vendorsInvited: rfq.invitedCount || rfq.invitedVendorIds?.length || 0,
    quotesReceived: rfq.quoteCount || 0,
    createdDate: formatDisplayDate(rfq.createdAt),
    quotes: (rfq.quotes || []).map(mapSchoolQuoteForCompare),
    orderId: rfq.orderId || null,
    // Present only once awarded — drives the "pay advance" / "pay remaining
    // balance" affordances directly on the list card.
    order: rfq.order || null,
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
  // Vendor-set advance — shown before the school ever awards, so they know
  // what they're committing to pay up front.
  advancePercent: quote.advancePercent ?? 0,
  advanceAmount: quote.advanceAmount ? `₹${quote.advanceAmount}` : '₹0.00',
  // 'submitted' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn' — drives
  // whether the compare view still offers "Award Contract" for this quote.
  status: quote.status,
  raw: quote,
});

// Terminal states that ended without an award — a vendor who hasn't quoted must
// see this, not "Pending", which used to invite a bid attempt the server would
// then reject (RFQ_NOT_ACCEPTING) since neither status accepts new quotes.
const TERMINAL_STATUS_LABELS = { cancelled: 'Cancelled', closed: 'Closed' };

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

  if (TERMINAL_STATUS_LABELS[rfq.status]) {
    return {
      status: TERMINAL_STATUS_LABELS[rfq.status],
      statusColor: 'bg-gray-100 text-gray-500 border-gray-200',
      statusBullet: 'bg-gray-400',
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
    // Reference images the school attached per uniform set (design/logo/fabric
    // photos) — flattened so the vendor's bid drawer can show a simple gallery.
    referenceImages: (rfq.meta?.uniformSets || []).flatMap((set) =>
      (set.images || [])
        .filter((img) => img.url)
        .map((img) => ({ setName: set.name, label: img.label, url: img.url }))
    ),
    vendorQuote: rfq.vendorQuote,
    ...statusMeta,
    raw: rfq,
  };
};

// Strip the wizard's local-only fields (raw File objects, base64 previews,
// upload-in-progress flags) down to what the server actually stores — just
// the label and the uploaded attachment's id. An image still mid-upload (or
// one that failed) has no attachmentId yet and is dropped rather than sent
// as a dead placeholder.
const serializeUniformSets = (uniformSets = []) =>
  uniformSets.map((set) => ({
    id: set.id,
    name: set.name,
    type: set.type,
    boysQty: set.boysQty,
    girlsQty: set.girlsQty,
    components: set.components,
    images: (set.images || [])
      .filter((img) => img.attachmentId)
      .map((img) => ({ label: img.label, attachmentId: img.attachmentId })),
  }));

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
  uniformSets: serializeUniformSets(uniformSets),
  invitedVendorIds: vendors.filter((v) => v.checked).map((v) => v.id),
  status,
});
