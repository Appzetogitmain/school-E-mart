const mongoose = require('mongoose');

const toRupees = (paise) => {
  if (paise == null) return null;
  return (Number(paise) / 100).toFixed(2);
};

const toDecimal = (value) => {
  if (value == null) return null;
  if (typeof value === 'object' && value.toString) return value.toString();
  return String(value);
};

const formatDate = (date) => {
  if (!date) return null;
  return new Date(date).toISOString();
};

const daysUntil = (date) => {
  if (!date) return null;
  const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `${diff} days` : 'Expired';
};

const serializeQuote = (quote, vendor = null) => {
  if (!quote) return null;

  const vendorName = vendor?.storeName || 'Vendor';
  const rating = vendor?.rating != null ? Number(toDecimal(vendor.rating)) : 0;

  return {
    _id: quote._id,
    rfqId: quote.rfqId,
    vendorId: quote.vendorId,
    vendorName,
    rating,
    items: (quote.items || []).map((item) => ({
      rfqItemIndex: item.rfqItemIndex,
      unitPricePaise: item.unitPricePaise,
      unitPrice: toRupees(item.unitPricePaise),
      taxRatePercent: toDecimal(item.taxRatePercent),
      lineTotalPaise: item.lineTotalPaise,
      lineTotal: toRupees(item.lineTotalPaise),
      remarks: item.remarks || '',
    })),
    subtotalPaise: quote.subtotalPaise,
    subtotal: toRupees(quote.subtotalPaise),
    taxPaise: quote.taxPaise,
    tax: toRupees(quote.taxPaise),
    totalPaise: quote.totalPaise,
    total: toRupees(quote.totalPaise),
    termsAndConditions: quote.termsAndConditions || '',
    deliveryTimeline: quote.deliveryTimeline || '',
    validUntil: formatDate(quote.validUntil),
    status: quote.status,
    createdAt: formatDate(quote.audit?.createdAt),
  };
};

/**
 * Reference-image attachment ids live nested inside `meta.uniformSets[].images[]`
 * (school-authored, not part of the Joi-validated top level) plus the flat
 * `attachments` array. Resolve them all to displayable URLs in one pass so
 * neither the school (resuming a draft) nor an invited vendor sees a dead id.
 */
const withResolvedImageUrls = (meta, attachmentUrlMap) => {
  if (!meta?.uniformSets?.length || !attachmentUrlMap) return meta;

  return {
    ...meta,
    uniformSets: meta.uniformSets.map((set) => ({
      ...set,
      images: (set.images || []).map((img) => ({
        ...img,
        url: img.attachmentId ? attachmentUrlMap.get(String(img.attachmentId)) || null : null,
      })),
    })),
  };
};

const serializeRfq = (rfq, { school = null, quotes = [], vendorQuote = null, attachmentUrlMap = null } = {}) => {
  if (!rfq) return null;

  const schoolName = school?.name || 'School';
  const city = school?.address?.city || '';
  const state = school?.address?.state || '';
  const location = [city, state].filter(Boolean).join(', ') || '—';

  const quoteCount = quotes.length;
  const invitedCount = (rfq.invitedVendorIds || []).length;

  return {
    _id: rfq._id,
    rfqNumber: rfq.rfqNumber,
    title: rfq.title,
    category: rfq.category,
    description: rfq.description,
    items: rfq.items || [],
    academicYear: rfq.academicYear || null,
    classes: rfq.classes || [],
    totalStudents: rfq.totalStudents || null,
    targetDeliveryDate: formatDate(rfq.targetDeliveryDate),
    quotationDeadline: formatDate(rfq.quotationDeadline),
    status: rfq.status,
    invitedVendorIds: rfq.invitedVendorIds || [],
    invitedCount,
    quoteCount,
    meta: withResolvedImageUrls(rfq.meta, attachmentUrlMap),
    attachmentUrls: attachmentUrlMap
      ? (rfq.attachments || []).map((id) => attachmentUrlMap.get(String(id))).filter(Boolean)
      : [],
    publishedAt: formatDate(rfq.publishedAt),
    awardedVendorId: rfq.awardedVendorId || null,
    awardedQuoteId: rfq.awardedQuoteId || null,
    schoolId: rfq.schoolId,
    schoolName,
    location,
    createdAt: formatDate(rfq.audit?.createdAt),
    updatedAt: formatDate(rfq.audit?.updatedAt),
    daysLeft: daysUntil(rfq.quotationDeadline),
    vendorQuote: vendorQuote ? serializeQuote(vendorQuote) : null,
    quotes: quotes.map((q) => serializeQuote(q.quote || q, q.vendor)),
  };
};

const buildUniformItems = (uniformSets = []) => {
  const items = [];

  uniformSets.forEach((set) => {
    const boysQty = parseInt(set.boysQty, 10) || 0;
    const girlsQty = parseInt(set.girlsQty, 10) || 0;
    const totalQty = boysQty + girlsQty;
    if (totalQty <= 0) return;

    const checkedComponents = (set.components || [])
      .filter((c) => c.checked)
      .map((c) => c.label)
      .join(', ');

    items.push({
      name: set.name || 'Uniform Set',
      specifications: [
        set.type ? `Type: ${set.type}` : null,
        boysQty ? `Boys: ${boysQty}` : null,
        girlsQty ? `Girls: ${girlsQty}` : null,
        checkedComponents ? `Components: ${checkedComponents}` : null,
      ]
        .filter(Boolean)
        .join(' | '),
      quantity: totalQty,
      uom: 'sets',
    });
  });

  return items;
};

const toObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
};

module.exports = {
  serializeRfq,
  serializeQuote,
  buildUniformItems,
  toRupees,
  toDecimal,
  toObjectId,
  daysUntil,
};
