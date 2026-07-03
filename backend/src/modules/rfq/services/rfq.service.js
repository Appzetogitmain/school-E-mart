const mongoose = require('mongoose');
const {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} = require('../../../common/errors');
const Rfq = require('../../../database/models/Rfq');
const Quote = require('../../../database/models/Quote');
const School = require('../../../database/models/School');
const VendorProfile = require('../../../database/models/VendorProfile');
const rfqRepository = require('../repositories/rfq.repository');
const quoteRepository = require('../repositories/quote.repository');
const { generateRfqNumber } = require('../utils/rfqNumber');
const { serializeRfq, serializeQuote, buildUniformItems, toObjectId } = require('../utils/serializers');

const assertVendorInvited = (rfq, vendorId) => {
  const invited = (rfq.invitedVendorIds || []).some((id) => String(id) === String(vendorId));
  if (!invited) {
    throw new ForbiddenError('You are not invited to this quotation request', 'RFQ_NOT_INVITED');
  }
};

const loadSchool = async (schoolId) => {
  const school = await School.findOne({
    _id: schoolId,
    'softDelete.isDeleted': { $ne: true },
  }).lean();
  if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
  return school;
};

const loadRfqForSchool = async (schoolId, rfqId) => {
  const rfq = await rfqRepository.findOne({ _id: rfqId, schoolId });
  if (!rfq) throw new NotFoundError('RFQ not found', 'RFQ_NOT_FOUND');
  return rfq;
};

const loadRfqForVendor = async (rfqId, vendorId) => {
  const rfq = await rfqRepository.findOne({ _id: rfqId });
  if (!rfq) throw new NotFoundError('RFQ not found', 'RFQ_NOT_FOUND');
  assertVendorInvited(rfq, vendorId);
  return rfq;
};

const enrichQuotesWithVendors = async (quotes = []) => {
  if (!quotes.length) return [];

  const vendorIds = [...new Set(quotes.map((q) => String(q.vendorId)))];
  const vendors = await VendorProfile.find({
    _id: { $in: vendorIds },
    'softDelete.isDeleted': { $ne: true },
  }).lean();
  const vendorMap = new Map(vendors.map((v) => [String(v._id), v]));

  return quotes.map((quote) => ({
    quote,
    vendor: vendorMap.get(String(quote.vendorId)) || null,
  }));
};

const rfqService = {
  async createRfq(schoolId, payload) {
    const isDraft = payload.status === 'draft';
    const items = buildUniformItems(payload.uniformSets || []);

    if (!isDraft && !items.length) {
      throw new BadRequestError('At least one uniform set with quantity is required', null, 'RFQ_ITEMS_REQUIRED');
    }

    const invitedVendorIds = (payload.invitedVendorIds || []).map(toObjectId).filter(Boolean);
    if (!isDraft && !invitedVendorIds.length) {
      throw new BadRequestError('At least one vendor must be invited', null, 'RFQ_VENDORS_REQUIRED');
    }

    if (invitedVendorIds.length) {
      const approvedVendors = await VendorProfile.countDocuments({
        _id: { $in: invitedVendorIds },
        approvalStatus: 'approved',
        'softDelete.isDeleted': { $ne: true },
      });
      if (approvedVendors !== invitedVendorIds.length) {
        throw new BadRequestError('One or more selected vendors are not approved', null, 'RFQ_INVALID_VENDORS');
      }
    }

    const status = payload.status === 'draft' ? 'draft' : 'open';
    const rfqNumber = await generateRfqNumber();

    const descriptionParts = [
      payload.specialInstructions,
      payload.additionalNotes,
      payload.academicYear ? `Academic Year: ${payload.academicYear}` : null,
      payload.classes?.length ? `Classes: ${payload.classes.join(', ')}` : null,
    ].filter(Boolean);

    const rfq = await rfqRepository.create({
      schoolId,
      rfqNumber,
      title: payload.title,
      category: 'uniform',
      description: descriptionParts.join('\n') || payload.title,
      items: items.length ? items : [{ name: payload.title, quantity: 1, uom: 'sets' }],
      academicYear: payload.academicYear || null,
      classes: payload.classes || [],
      totalStudents: payload.totalStudents ? Number(payload.totalStudents) : null,
      targetDeliveryDate: payload.requiredDate || null,
      quotationDeadline: payload.quotationDeadline || null,
      invitedVendorIds,
      status,
      publishedAt: status === 'open' ? new Date() : null,
      meta: {
        uniformSets: payload.uniformSets || [],
        additionalNotes: payload.additionalNotes || '',
      },
    });

    const school = await loadSchool(schoolId);
    return serializeRfq(rfq, { school });
  },

  async listSchoolRfqs(schoolId, query = {}) {
    const filter = { schoolId };
    if (query.status) filter.status = query.status;

    const { data, pagination } = await rfqRepository.paginateRfqs(filter, query);
    const school = await loadSchool(schoolId);

    const rfqIds = data.map((r) => r._id);
    const quoteCounts = await Quote.aggregate([
      { $match: { rfqId: { $in: rfqIds }, 'softDelete.isDeleted': { $ne: true } } },
      { $group: { _id: '$rfqId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(quoteCounts.map((c) => [String(c._id), c.count]));

    const serialized = data.map((rfq) =>
      serializeRfq(rfq, {
        school,
        quotes: [],
      })
    ).map((rfq, idx) => ({
      ...rfq,
      quoteCount: countMap.get(String(data[idx]._id)) || 0,
    }));

    return { data: serialized, pagination };
  },

  async getSchoolRfq(schoolId, rfqId) {
    const rfq = await loadRfqForSchool(schoolId, rfqId);
    const school = await loadSchool(schoolId);
    const quotes = await quoteRepository.findByRfq(rfqId);
    const enriched = await enrichQuotesWithVendors(quotes);

    return serializeRfq(rfq, { school, quotes: enriched });
  },

  async listVendorRfqs(vendorId, query = {}) {
    const filter = {
      invitedVendorIds: vendorId,
      status: { $in: ['open', 'reviewing', 'awarded', 'closed'] },
    };

    const { data, pagination } = await rfqRepository.paginateRfqs(filter, query);

    const rfqIds = data.map((r) => r._id);
    const schoolIds = [...new Set(data.map((r) => String(r.schoolId)))];

    const [schools, vendorQuotes] = await Promise.all([
      School.find({ _id: { $in: schoolIds }, 'softDelete.isDeleted': { $ne: true } }).lean(),
      Quote.find({
        rfqId: { $in: rfqIds },
        vendorId,
        'softDelete.isDeleted': { $ne: true },
      }).lean(),
    ]);

    const schoolMap = new Map(schools.map((s) => [String(s._id), s]));
    const quoteMap = new Map(vendorQuotes.map((q) => [String(q.rfqId), q]));

    const serialized = data.map((rfq) => {
      const school = schoolMap.get(String(rfq.schoolId));
      const vendorQuote = quoteMap.get(String(rfq._id)) || null;
      return serializeRfq(rfq, { school, vendorQuote });
    });

    return { data: serialized, pagination };
  },

  async getVendorRfq(vendorId, rfqId) {
    const rfq = await loadRfqForVendor(rfqId, vendorId);
    const school = await loadSchool(rfq.schoolId);
    const vendorQuote = await quoteRepository.findByRfqAndVendor(rfqId, vendorId);

    return serializeRfq(rfq, { school, vendorQuote });
  },

  async submitQuote(vendorId, rfqId, payload) {
    const rfq = await loadRfqForVendor(rfqId, vendorId);

    if (!['open', 'reviewing'].includes(rfq.status)) {
      throw new BadRequestError('This RFQ is no longer accepting quotes', null, 'RFQ_NOT_ACCEPTING');
    }

    if (rfq.quotationDeadline && new Date(rfq.quotationDeadline) < new Date()) {
      throw new BadRequestError('Quotation deadline has passed', null, 'RFQ_DEADLINE_PASSED');
    }

    const existing = await quoteRepository.findByRfqAndVendor(rfqId, vendorId);
    if (existing) {
      throw new ConflictError('You have already submitted a quote for this RFQ', 'QUOTE_ALREADY_EXISTS');
    }

    const unitPricePaise = Math.round(Number(payload.unitPrice) * 100);
    const taxRate = mongoose.Types.Decimal128.fromString(String(payload.taxRatePercent ?? 0));

    const items = (rfq.items || []).map((item, index) => {
      const lineSubtotal = unitPricePaise * item.quantity;
      const taxAmount = Math.round(lineSubtotal * (Number(payload.taxRatePercent || 0) / 100));
      return {
        rfqItemIndex: index,
        unitPricePaise,
        taxRatePercent: taxRate,
        lineTotalPaise: lineSubtotal + taxAmount,
        remarks: payload.remarks || '',
      };
    });

    const subtotalPaise = items.reduce(
      (sum, item) => sum + item.unitPricePaise * (rfq.items[item.rfqItemIndex]?.quantity || 1),
      0
    );
    const totalPaise = items.reduce((sum, item) => sum + item.lineTotalPaise, 0);
    const taxPaise = totalPaise - subtotalPaise;

    const validUntil = payload.validUntil
      ? new Date(payload.validUntil)
      : rfq.quotationDeadline
        ? new Date(rfq.quotationDeadline)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const quote = await quoteRepository.create({
      rfqId,
      vendorId,
      items,
      subtotalPaise,
      taxPaise,
      totalPaise,
      termsAndConditions: payload.termsAndConditions || payload.remarks || '',
      deliveryTimeline: payload.deliveryTimeline || '',
      validUntil,
      status: 'submitted',
    });

    // Move RFQ to reviewing once first quote arrives
    if (rfq.status === 'open') {
      await rfqRepository.updateById(rfqId, { $set: { status: 'reviewing' } });
    }

    const vendor = await VendorProfile.findById(vendorId).lean();
    return serializeQuote(quote, vendor);
  },

  async awardQuote(schoolId, rfqId, quoteId) {
    const rfq = await loadRfqForSchool(schoolId, rfqId);

    if (!['open', 'reviewing'].includes(rfq.status)) {
      throw new BadRequestError('This RFQ cannot be awarded in its current status', null, 'RFQ_CANNOT_AWARD');
    }

    const quote = await quoteRepository.findOne({ _id: quoteId, rfqId });
    if (!quote) throw new NotFoundError('Quote not found', 'QUOTE_NOT_FOUND');

    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        await Quote.updateMany(
          { rfqId, _id: { $ne: quoteId }, 'softDelete.isDeleted': { $ne: true } },
          { $set: { status: 'rejected' } },
          { session }
        );

        await Quote.updateOne(
          { _id: quoteId },
          { $set: { status: 'accepted' } },
          { session }
        );

        await Rfq.updateOne(
          { _id: rfqId },
          {
            $set: {
              status: 'awarded',
              awardedVendorId: quote.vendorId,
              awardedQuoteId: quoteId,
            },
          },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }

    const updatedRfq = await loadRfqForSchool(schoolId, rfqId);
    const school = await loadSchool(schoolId);
    const quotes = await quoteRepository.findByRfq(rfqId);
    const enriched = await enrichQuotesWithVendors(quotes);

    return serializeRfq(updatedRfq, { school, quotes: enriched });
  },
};

module.exports = rfqService;
