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
const Order = require('../../../database/models/Order');
const rfqRepository = require('../repositories/rfq.repository');
const quoteRepository = require('../repositories/quote.repository');
const rfqNumberUtil = require('../utils/rfqNumber');
const { serializeRfq, serializeQuote, buildUniformItems, toObjectId } = require('../utils/serializers');
const { triggerService } = require('../../../services/notification');
const { generateOrderNumber } = require('../../orders/utils/orderNumber');
const { runAtomic } = require('../../orders/utils/atomic');
const paymentService = require('../../orders/services/payment.service');
const paymentRepository = require('../../orders/repositories/payment.repository');
const config = require('../../../config');

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

/**
 * Loads an RFQ-awarded order scoped to the requesting school. Ownership is
 * proven via the Rfq (schoolId + orderId), not Order.userId — the same trust
 * boundary every other RFQ endpoint already uses, so a school can't reach an
 * order that isn't theirs just by guessing an id.
 */
const loadRfqOrderForSchool = async (schoolId, orderId) => {
  const rfq = await Rfq.findOne({ orderId, schoolId }).lean();
  if (!rfq) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');

  const order = await Order.findOne({ _id: orderId, 'softDelete.isDeleted': { $ne: true } });
  if (!order || !order.rfqAdvance) throw new NotFoundError('Order not found', 'ORDER_NOT_FOUND');

  return { rfq, order };
};

/** Mirrors orders.controller.js's createOrder checkout shape so the frontend's
 *  existing openRazorpayCheckout() helper works unmodified for advance/remainder
 *  payments too. Null for anything the gateway itself already settled (e.g. a
 *  zero-amount advance, captured with no gateway round-trip). */
const buildCheckout = (payment) => {
  if (!payment || payment.gateway !== 'razorpay') return null;
  return {
    keyId: config.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    razorpayOrderId: payment.gatewayOrderId,
    amountPaise: payment.amountPaise,
    currency: payment.currency || 'INR',
  };
};

/**
 * `allowExistingQuote` covers a vendor the school later removed from
 * `invitedVendorIds` — editing the invite list must not also retroactively cut
 * off a vendor's visibility into a quote they already put real work into
 * submitting. It must never loosen who can submit a *new* quote, only who can
 * view an RFQ they already responded to.
 */
const loadRfqForVendor = async (rfqId, vendorId, { allowExistingQuote = false } = {}) => {
  const rfq = await rfqRepository.findOne({ _id: rfqId });
  if (!rfq) throw new NotFoundError('RFQ not found', 'RFQ_NOT_FOUND');

  if (allowExistingQuote) {
    const invited = (rfq.invitedVendorIds || []).some((id) => String(id) === String(vendorId));
    if (!invited) {
      const hasQuote = await quoteRepository.findByRfqAndVendor(rfqId, vendorId);
      if (!hasQuote) assertVendorInvited(rfq, vendorId); // throws — neither invited nor quoted
    }
    return rfq;
  }

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

    const descriptionParts = [
      payload.specialInstructions,
      payload.additionalNotes,
      payload.academicYear ? `Academic Year: ${payload.academicYear}` : null,
      payload.classes?.length ? `Classes: ${payload.classes.join(', ')}` : null,
    ].filter(Boolean);

    const docWithoutNumber = {
      schoolId,
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
    };

    // generateRfqNumber() reads-then-computes-next with no atomic reservation, so
    // two requests racing (a double-click, two staff at the same school) can both
    // read the same "latest" number and collide on the unique index. Regenerate
    // and retry rather than surfacing a raw duplicate-key error.
    const MAX_NUMBER_ATTEMPTS = 3;
    let rfq;
    for (let attempt = 1; attempt <= MAX_NUMBER_ATTEMPTS; attempt += 1) {
      const rfqNumber = await rfqNumberUtil.generateRfqNumber();
      try {
        rfq = await rfqRepository.create({ ...docWithoutNumber, rfqNumber });
        break;
      } catch (error) {
        const isDuplicateRfqNumber = error?.code === 11000 && error?.keyPattern?.rfqNumber;
        if (!isDuplicateRfqNumber || attempt === MAX_NUMBER_ATTEMPTS) throw error;
      }
    }

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

    if (payload.status === 'cancelled' && !['open', 'reviewing'].includes(existing.status)) {
      throw new BadRequestError(
        `Only a request that is open or under review can be cancelled — this one is "${existing.status}".`,
        null,
        'RFQ_CANNOT_CANCEL'
      );
    }

    const isDraft = payload.status === 'draft';
    const items = buildUniformItems(payload.uniformSets || []);

    // A quote's items[].rfqItemIndex is a positional index into rfq.items,
    // fixed at the moment the vendor submitted. Letting the school add, remove,
    // or reorder uniform sets after that would silently point existing quotes'
    // line items at the wrong (or a nonexistent) uniform set.
    if (payload.uniformSets) {
      const quoteCount = await Quote.countDocuments({ rfqId, 'softDelete.isDeleted': { $ne: true } });
      if (quoteCount > 0) {
        throw new BadRequestError(
          'This request already has vendor quotes, so its items can no longer be changed. Cancel it and create a new request instead.',
          null,
          'RFQ_HAS_QUOTES'
        );
      }
    }

    // Falls back to what's already stored so this check can't be bypassed by
    // simply leaving `uniformSets` out of a save that flips status to 'open'.
    const effectiveItems = payload.uniformSets !== undefined
      ? items
      : buildUniformItems(existing.meta?.uniformSets || []);
    if (!isDraft && !effectiveItems.length) {
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

    if (rfq.status === 'cancelled' && existing.status !== 'cancelled') {
      triggerService.notifyRfqCancelled(rfq, (rfq.invitedVendorIds || []).map(String));
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

    // Batched, not per-row: one query covers every awarded RFQ's order so the
    // list view can show payment status (and prompt "pay advance"/"pay
    // remainder") without a click into each one.
    const orderIds = data.map((r) => r.orderId).filter(Boolean);
    const orders = orderIds.length
      ? await Order.find({ _id: { $in: orderIds } })
          .select('orderNumber orderStatus paymentStatus totalPaise rfqAdvance')
          .lean()
      : [];
    const orderMap = new Map(orders.map((o) => [String(o._id), o]));

    const serialized = data.map((rfq) =>
      serializeRfq(rfq, {
        school,
        quotes: [],
        attachmentUrlMap,
        order: rfq.orderId ? orderMap.get(String(rfq.orderId)) : null,
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
    const order = rfq.orderId ? await Order.findById(rfq.orderId).lean() : null;

    return serializeRfq(rfq, { school, quotes: enriched, attachmentUrlMap, order });
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
    // A vendor who already quoted must still be able to find this RFQ in their
    // list even if the school later edited the invite list and removed them —
    // matches getVendorRfq's allowExistingQuote. 'cancelled' is included too, so
    // a vendor sees why an RFQ they were tracking disappeared instead of it just
    // vanishing with no explanation.
    const quotedRfqIds = await Quote.find({ vendorId, 'softDelete.isDeleted': { $ne: true } }).distinct('rfqId');

    const filter = {
      $or: [{ invitedVendorIds: vendorId }, { _id: { $in: quotedRfqIds } }],
      status: { $in: ['open', 'reviewing', 'awarded', 'closed', 'cancelled'] },
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
    const rfq = await loadRfqForVendor(rfqId, vendorId, { allowExistingQuote: true });
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

    const advancePercent = Number(payload.advancePercent) || 0;
    const advanceAmountPaise = Math.round(totalPaise * (advancePercent / 100));

    const quote = await quoteRepository.create({
      rfqId,
      vendorId,
      items,
      subtotalPaise,
      taxPaise,
      totalPaise,
      advancePercent,
      advanceAmountPaise,
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

  /**
   * Awards a quote and, in the same breath, creates the Order the school will
   * pay the vendor's advance against — per the product decision that award
   * flows straight into "now go pay the advance", not a separate manual step.
   * The order starts at paymentStatus 'pending' with no Payment attached yet;
   * initiateAdvancePayment/confirmAdvancePayment (below) drive it to
   * 'partially_paid' once the gateway actually captures the advance.
   */
  async awardQuote(schoolId, rfqId, quoteId, actor = {}) {
    if (!actor.userId) {
      throw new BadRequestError('Awarding a quote requires an authenticated actor', null, 'ACTOR_REQUIRED');
    }

    const rfq = await loadRfqForSchool(schoolId, rfqId);

    if (!['open', 'reviewing'].includes(rfq.status)) {
      throw new BadRequestError('This RFQ cannot be awarded in its current status', null, 'RFQ_CANNOT_AWARD');
    }

    const quote = await quoteRepository.findOne({ _id: quoteId, rfqId });
    if (!quote) throw new NotFoundError('Quote not found', 'QUOTE_NOT_FOUND');

    const school = await loadSchool(schoolId);
    if (!school.address?.line1 || !school.address?.city || !school.address?.pinCode) {
      throw new BadRequestError(
        "This school's address is incomplete, so an order can't be created for delivery. Update the school profile first.",
        null,
        'SCHOOL_ADDRESS_INCOMPLETE'
      );
    }

    const otherQuotes = await Quote.find({
      rfqId,
      _id: { $ne: quoteId },
      'softDelete.isDeleted': { $ne: true },
    })
      .select('vendorId')
      .lean();
    const rejectedVendorIds = otherQuotes.map((q) => q.vendorId);

    const remainderPaise = Math.max(0, quote.totalPaise - quote.advanceAmountPaise);
    const orderNumber = generateOrderNumber();

    const order = await runAtomic(async (session) => {
      const opts = session ? { session } : {};

      await Quote.updateMany(
        { rfqId, _id: { $ne: quoteId }, 'softDelete.isDeleted': { $ne: true } },
        { $set: { status: 'rejected' } },
        opts
      );

      await Quote.updateOne(
        { _id: quoteId },
        { $set: { status: 'accepted' } },
        opts
      );

      const items = quote.items.map((item) => {
        const rfqItem = rfq.items[item.rfqItemIndex] || {};
        const quantity = rfqItem.quantity || 1;
        const lineSubtotalPaise = item.unitPricePaise * quantity;
        return {
          // No real Product backs an RFQ line item — reusing the quote's own
          // _id here mirrors the existing kit-order convention (see Kit
          // checkout) of aliasing productId to whatever real document the
          // line actually traces back to.
          productId: quote._id,
          vendorId: quote.vendorId,
          rfqId: rfq._id,
          quoteId: quote._id,
          name: rfqItem.name || rfq.title,
          sku: `RFQ-${rfq.rfqNumber}-${item.rfqItemIndex}`,
          pricePaise: item.unitPricePaise,
          mrpPaise: item.unitPricePaise,
          quantity,
          taxRatePercent: item.taxRatePercent,
          taxPaise: Math.max(0, item.lineTotalPaise - lineSubtotalPaise),
          lineTotalPaise: item.lineTotalPaise,
          fulfilmentStatus: 'placed',
        };
      });

      const [createdOrder] = await Order.create(
        [
          {
            orderNumber,
            userId: actor.userId,
            audience: 'school',
            items,
            vendorIds: [quote.vendorId],
            subtotalPaise: quote.subtotalPaise,
            taxPaise: quote.taxPaise,
            discountPaise: 0,
            platformFeePaise: 0,
            deliveryChargePaise: 0,
            handlingChargePaise: 0,
            totalPaise: quote.totalPaise,
            walletAmountPaise: 0,
            address: {
              name: school.name,
              phone: school.phone || '',
              line1: school.address.line1,
              line2: school.address.line2 || '',
              city: school.address.city,
              state: school.address.state || '',
              country: school.address.country || 'India',
              pinCode: school.address.pinCode,
            },
            deliveryType: 'home',
            paymentMethod: 'online',
            paymentStatus: 'pending',
            rfqAdvance: {
              advancePaise: quote.advanceAmountPaise,
              remainderPaise,
            },
            orderStatus: 'placed',
            statusHistory: [
              {
                status: 'placed',
                at: new Date(),
                note: `Order created from awarded quotation for RFQ ${rfq.rfqNumber}`,
                byUserId: actor.userId,
              },
            ],
            placedAt: new Date(),
          },
        ],
        opts
      );

      await Rfq.updateOne(
        { _id: rfqId },
        {
          $set: {
            status: 'awarded',
            awardedVendorId: quote.vendorId,
            awardedQuoteId: quoteId,
            orderId: createdOrder._id,
          },
        },
        opts
      );

      return createdOrder;
    });

    const updatedRfq = await loadRfqForSchool(schoolId, rfqId);
    triggerService.notifyQuoteAwarded(updatedRfq, quote.vendorId);
    triggerService.notifyQuoteRejected(updatedRfq, rejectedVendorIds);

    const quotes = await quoteRepository.findByRfq(rfqId);
    const enriched = await enrichQuotesWithVendors(quotes);
    const attachmentUrlMap = await buildAttachmentUrlMap(updatedRfq);

    return serializeRfq(updatedRfq, { school, quotes: enriched, attachmentUrlMap, order });
  },

  /** Creates (or re-fetches, if already initiated) the gateway payment for the
   *  advance on an awarded RFQ order. Kept separate from awardQuote so the
   *  school lands on an order/payment screen first — awarding itself never
   *  blocks on the gateway being reachable. */
  async initiateAdvancePayment(schoolId, orderId) {
    const { order } = await loadRfqOrderForSchool(schoolId, orderId);

    // rfqAdvance.advancePaymentId is set the moment a payment is first created
    // for this order — paymentStatus alone can't tell "already initiated"
    // from "not yet started", since a not-yet-captured advance leaves it at
    // 'pending' too. (order.paymentId isn't reliable here — it's overwritten
    // once a remainder payment is later created for the same order.)
    if (order.paymentStatus !== 'pending' || order.rfqAdvance.advancePaymentId) {
      throw new ConflictError('The advance for this order has already been initiated or paid', 'ADVANCE_ALREADY_INITIATED');
    }

    const payment = await paymentService.createPaymentForOrder(order, {
      method: 'upi',
      amountPaise: order.rfqAdvance.advancePaise,
    });
    await Order.updateOne(
      { _id: orderId },
      { $set: { paymentId: payment._id, 'rfqAdvance.advancePaymentId': payment._id } }
    );

    // A 0%-advance quote settles instantly — createPaymentForOrder captures a
    // zero-charge payment with no gateway round-trip — so reflect that now
    // rather than stranding the school on a "pay advance" screen with
    // nothing left to pay.
    if (payment.status === 'captured') {
      await Order.updateOne({ _id: orderId }, { $set: { paymentStatus: 'partially_paid' } });
    }

    return { payment, checkout: buildCheckout(payment) };
  },

  /** Confirms the advance payment after the gateway checkout completes.
   *  Idempotent: re-confirming an already-captured advance just returns it. */
  async confirmAdvancePayment(schoolId, orderId, payload = {}) {
    const { order } = await loadRfqOrderForSchool(schoolId, orderId);

    if (order.paymentStatus !== 'pending') {
      // Once a remainder payment can also exist for this order, findOne-by-
      // orderId is ambiguous between the two Payment docs — advancePaymentId
      // is the reliable pointer to specifically the advance payment.
      const payment = order.rfqAdvance.advancePaymentId
        ? await paymentRepository.findById(order.rfqAdvance.advancePaymentId)
        : null;
      return { payment, order };
    }
    if (!order.rfqAdvance.advancePaymentId) {
      throw new BadRequestError('Advance payment has not been initiated yet', null, 'ADVANCE_NOT_INITIATED');
    }

    const payment = await paymentService.confirmPayment(orderId, {
      paymentId: order.rfqAdvance.advancePaymentId,
      ...payload,
    });
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { paymentStatus: 'partially_paid' } },
      { new: true }
    ).lean();

    triggerService.notifyRfqAdvancePaid(updatedOrder);
    return { payment, order: updatedOrder };
  },

  /** Creates the gateway payment for whatever's left of the order total once
   *  the advance is captured. Available any time after the advance — there's
   *  no gate tied to delivery status. */
  async initiateRemainderPayment(schoolId, orderId) {
    const { order } = await loadRfqOrderForSchool(schoolId, orderId);

    if (order.paymentStatus === 'paid') {
      throw new ConflictError('This order is already fully paid', 'ORDER_ALREADY_PAID');
    }
    if (order.paymentStatus !== 'partially_paid') {
      throw new BadRequestError('Pay the advance before paying the remaining balance', null, 'ADVANCE_NOT_PAID');
    }
    // Mirrors initiateAdvancePayment's guard: paymentStatus alone can't tell
    // "already initiated, not yet captured" from "never started" — without
    // this, a second click before the first checkout completes would create
    // a second remainder Payment and silently orphan the first.
    if (order.rfqAdvance.remainderPaymentId) {
      throw new ConflictError('The remaining balance payment has already been initiated', 'REMAINDER_ALREADY_INITIATED');
    }

    const payment = await paymentService.createPaymentForOrder(order, {
      method: 'upi',
      amountPaise: order.rfqAdvance.remainderPaise,
    });
    await Order.updateOne(
      { _id: orderId },
      { $set: { paymentId: payment._id, 'rfqAdvance.remainderPaymentId': payment._id } }
    );

    if (payment.status === 'captured') {
      await Order.updateOne(
        { _id: orderId },
        { $set: { paymentStatus: 'paid', 'rfqAdvance.remainderPaidAt': new Date() } }
      );
    }

    return { payment, checkout: buildCheckout(payment) };
  },

  /** Confirms the remainder payment after the gateway checkout completes,
   *  settling the order. Idempotent, matching confirmAdvancePayment. */
  async confirmRemainderPayment(schoolId, orderId, payload = {}) {
    const { order } = await loadRfqOrderForSchool(schoolId, orderId);

    if (order.paymentStatus === 'paid') {
      // Same ambiguity as confirmAdvancePayment's idempotent branch —
      // remainderPaymentId is the reliable pointer to this specific payment.
      const payment = order.rfqAdvance.remainderPaymentId
        ? await paymentRepository.findById(order.rfqAdvance.remainderPaymentId)
        : null;
      return { payment, order };
    }
    if (!order.rfqAdvance.remainderPaymentId) {
      throw new BadRequestError('The remaining balance payment has not been initiated yet', null, 'REMAINDER_NOT_INITIATED');
    }

    const payment = await paymentService.confirmPayment(orderId, {
      paymentId: order.rfqAdvance.remainderPaymentId,
      ...payload,
    });
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: { paymentStatus: 'paid', 'rfqAdvance.remainderPaidAt': new Date() } },
      { new: true }
    ).lean();

    triggerService.notifyRfqRemainderPaid(updatedOrder);
    return { payment, order: updatedOrder };
  },
};

module.exports = rfqService;
