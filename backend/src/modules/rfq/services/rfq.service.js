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
const Attachment = require('../../../database/models/Attachment');
const rfqRepository = require('../repositories/rfq.repository');
const quoteRepository = require('../repositories/quote.repository');
const { generateRfqNumber } = require('../utils/rfqNumber');
const { serializeRfq, serializeQuote, buildUniformItems, toObjectId } = require('../utils/serializers');
const { triggerService } = require('../../../services/notification');

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

/** Every reference-image attachment id a uniform-set request carries — used both to persist the RFQ's flat `attachments` list and to resolve display URLs. */
const deriveAttachmentIds = (uniformSets = []) => {
  const ids = [];
  uniformSets.forEach((set) => {
    (set.images || []).forEach((img) => {
      const id = toObjectId(img.attachmentId);
      if (id) ids.push(id);
    });
  });
  return ids;
};

/** One batched lookup covering every reference-image id across one or many RFQs, so list views don't issue a query per row. */
const buildAttachmentUrlMap = async (rfqOrRfqs) => {
  const list = Array.isArray(rfqOrRfqs) ? rfqOrRfqs : [rfqOrRfqs];
  const ids = new Set();
  list.forEach((rfq) => {
    (rfq?.attachments || []).forEach((id) => ids.add(String(id)));
    (rfq?.meta?.uniformSets || []).forEach((set) => {
      (set.images || []).forEach((img) => {
        if (img.attachmentId) ids.add(String(img.attachmentId));
      });
    });
  });

  if (!ids.size) return new Map();

  const docs = await Attachment.find({ _id: { $in: [...ids] } }).select('storageKey').lean();
  return new Map(docs.map((doc) => [String(doc._id), doc.storageKey]));
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
      attachments: deriveAttachmentIds(payload.uniformSets || []),
      status,
      publishedAt: status === 'open' ? new Date() : null,
      meta: {
        uniformSets: payload.uniformSets || [],
        additionalNotes: payload.additionalNotes || '',
      },
    });

    if (status === 'open' && invitedVendorIds.length) {
      triggerService.notifyRfqPublished(rfq, invitedVendorIds);
    }

    const school = await loadSchool(schoolId);
    const attachmentUrlMap = await buildAttachmentUrlMap(rfq);
    return serializeRfq(rfq, { school, attachmentUrlMap });
  },

  async updateRfq(schoolId, rfqId, payload) {
    // Needed to tell newly-invited vendors from ones already notified on a
    // previous save, and to detect the draft → open transition.
    const existing = await loadRfqForSchool(schoolId, rfqId);

    const isDraft = payload.status === 'draft';
    const items = buildUniformItems(payload.uniformSets || []);

    if (!isDraft && payload.uniformSets && !items.length) {
      throw new BadRequestError('At least one uniform set with quantity is required', null, 'RFQ_ITEMS_REQUIRED');
    }

    const invitedVendorIds = payload.invitedVendorIds ? (payload.invitedVendorIds || []).map(toObjectId).filter(Boolean) : undefined;
    if (!isDraft && invitedVendorIds && !invitedVendorIds.length) {
      throw new BadRequestError('At least one vendor must be invited', null, 'RFQ_VENDORS_REQUIRED');
    }

    if (invitedVendorIds && invitedVendorIds.length) {
      const approvedVendors = await VendorProfile.countDocuments({
        _id: { $in: invitedVendorIds },
        approvalStatus: 'approved',
        'softDelete.isDeleted': { $ne: true },
      });
      if (approvedVendors !== invitedVendorIds.length) {
        throw new BadRequestError('One or more selected vendors are not approved', null, 'RFQ_INVALID_VENDORS');
      }
    }

    const descriptionParts = [
      payload.specialInstructions !== undefined ? payload.specialInstructions : null,
      payload.additionalNotes !== undefined ? payload.additionalNotes : null,
      payload.academicYear ? `Academic Year: ${payload.academicYear}` : null,
      payload.classes?.length ? `Classes: ${payload.classes.join(', ')}` : null,
    ].filter(Boolean);

    const updateData = {
      title: payload.title,
      academicYear: payload.academicYear,
      classes: payload.classes,
      totalStudents: payload.totalStudents ? Number(payload.totalStudents) : undefined,
      targetDeliveryDate: payload.requiredDate,
      quotationDeadline: payload.quotationDeadline,
      status: payload.status,
      additionalNotes: payload.additionalNotes,
    };

    if (invitedVendorIds) updateData.invitedVendorIds = invitedVendorIds;
    if (payload.title || payload.specialInstructions || payload.additionalNotes || payload.academicYear || payload.classes) {
      updateData.description = descriptionParts.join('\n');
    }
    if (payload.uniformSets) {
      updateData['meta.uniformSets'] = payload.uniformSets;
      updateData.items = items.length ? items : [{ name: payload.title || 'Uniform Request', quantity: 1, uom: 'sets' }];
      updateData.attachments = deriveAttachmentIds(payload.uniformSets);
    }
    if (payload.status === 'open') {
      updateData.publishedAt = new Date();
    }

    // Strip undefined keys
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    const rfq = await Rfq.findOneAndUpdate(
      { _id: rfqId, schoolId, 'softDelete.isDeleted': { $ne: true } },
      { $set: updateData },
      { new: true }
    );
    if (!rfq) throw new NotFoundError('RFQ not found', 'RFQ_NOT_FOUND');

    // 'reviewing' is still a live, vendor-facing RFQ (submitQuote moves it
    // there as soon as the first quote lands) — a vendor added at that point
    // must be told just as much as one added while still 'open'.
    const isLiveNow = ['open', 'reviewing'].includes(rfq.status);
    if (isLiveNow) {
      const wasLiveBefore = ['open', 'reviewing', 'awarded', 'closed'].includes(existing.status);
      const currentInvitedIds = (rfq.invitedVendorIds || []).map(String);
      const priorInvitedIds = new Set((existing.invitedVendorIds || []).map(String));
      // First time going live, every invited vendor is new; once already
      // live, only notify vendors added since the last save — the rest were
      // already told.
      const newlyInvitedIds = wasLiveBefore
        ? currentInvitedIds.filter((id) => !priorInvitedIds.has(id))
        : currentInvitedIds;
      if (newlyInvitedIds.length) {
        triggerService.notifyRfqPublished(rfq, newlyInvitedIds);
      }
    }

    const school = await loadSchool(schoolId);
    const attachmentUrlMap = await buildAttachmentUrlMap(rfq);
    return serializeRfq(rfq, { school, attachmentUrlMap });
  },

  async listSchoolRfqs(schoolId, query = {}) {
    const filter = { schoolId };
    if (query.status) filter.status = query.status;

    const { data, pagination } = await rfqRepository.paginateRfqs(filter, query);
    const school = await loadSchool(schoolId);
    const attachmentUrlMap = await buildAttachmentUrlMap(data);

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
        attachmentUrlMap,
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
    const attachmentUrlMap = await buildAttachmentUrlMap(rfq);

    return serializeRfq(rfq, { school, quotes: enriched, attachmentUrlMap });
  },

  /**
   * Discard a draft request.
   *
   * Deliberately restricted to drafts: once an RFQ is open, vendors have been
   * invited and may already have priced quotes against it, so removing it would
   * destroy their work and the school's audit trail. Anything past draft has to
   * be cancelled (status: 'cancelled'), which keeps the record.
   */
  async deleteRfq(schoolId, rfqId, deletedBy) {
    const rfq = await loadRfqForSchool(schoolId, rfqId);

    if (rfq.status !== 'draft') {
      throw new BadRequestError(
        `Only draft requests can be deleted. This request is "${rfq.status}" — cancel it instead.`,
        null,
        'RFQ_NOT_DRAFT'
      );
    }

    const quoteCount = await Quote.countDocuments({
      rfqId: rfq._id,
      'softDelete.isDeleted': { $ne: true },
    });
    if (quoteCount > 0) {
      throw new BadRequestError(
        'This request already has vendor quotes and cannot be deleted.',
        null,
        'RFQ_HAS_QUOTES'
      );
    }

    await rfqRepository.softDeleteById(rfqId, { deletedBy });
    return { deleted: true };
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
    const attachmentUrlMap = await buildAttachmentUrlMap(data);

    const serialized = data.map((rfq) => {
      const school = schoolMap.get(String(rfq.schoolId));
      const vendorQuote = quoteMap.get(String(rfq._id)) || null;
      return serializeRfq(rfq, { school, vendorQuote, attachmentUrlMap });
    });

    return { data: serialized, pagination };
  },

  async getVendorRfq(vendorId, rfqId) {
    const rfq = await loadRfqForVendor(rfqId, vendorId);
    const school = await loadSchool(rfq.schoolId);
    const vendorQuote = await quoteRepository.findByRfqAndVendor(rfqId, vendorId);
    const attachmentUrlMap = await buildAttachmentUrlMap(rfq);

    return serializeRfq(rfq, { school, vendorQuote, attachmentUrlMap });
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
    triggerService.notifyQuoteSubmitted(rfq.schoolId, rfq, vendor?.storeName);
    return serializeQuote(quote, vendor);
  },

  async awardQuote(schoolId, rfqId, quoteId) {
    const rfq = await loadRfqForSchool(schoolId, rfqId);

    if (!['open', 'reviewing'].includes(rfq.status)) {
      throw new BadRequestError('This RFQ cannot be awarded in its current status', null, 'RFQ_CANNOT_AWARD');
    }

    const quote = await quoteRepository.findOne({ _id: quoteId, rfqId });
    if (!quote) throw new NotFoundError('Quote not found', 'QUOTE_NOT_FOUND');

    const otherQuotes = await Quote.find({
      rfqId,
      _id: { $ne: quoteId },
      'softDelete.isDeleted': { $ne: true },
    })
      .select('vendorId')
      .lean();
    const rejectedVendorIds = otherQuotes.map((q) => q.vendorId);

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
    triggerService.notifyQuoteAwarded(updatedRfq, quote.vendorId);
    triggerService.notifyQuoteRejected(updatedRfq, rejectedVendorIds);

    const school = await loadSchool(schoolId);
    const quotes = await quoteRepository.findByRfq(rfqId);
    const enriched = await enrichQuotesWithVendors(quotes);
    const attachmentUrlMap = await buildAttachmentUrlMap(updatedRfq);

    return serializeRfq(updatedRfq, { school, quotes: enriched, attachmentUrlMap });
  },
};

module.exports = rfqService;
