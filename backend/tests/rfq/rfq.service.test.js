const mongoose = require('mongoose');
const rfqService = require('../../src/modules/rfq/services/rfq.service');
const rfqNumberUtil = require('../../src/modules/rfq/utils/rfqNumber');
const { createRfqSchema, updateRfqSchema } = require('../../src/modules/rfq/validators/rfq.validator');
const Rfq = require('../../src/database/models/Rfq');
const Quote = require('../../src/database/models/Quote');
const Order = require('../../src/database/models/Order');
const School = require('../../src/database/models/School');
const Notification = require('../../src/database/models/Notification');
const { createVendorUser } = require('../vendor/helpers');

const DAY = 24 * 60 * 60 * 1000;

describe('rfqService', () => {
  let schoolId;
  let schoolAdminUserId;
  let vendorId;
  let vendorUserId;

  const baseUniformSet = (overrides = {}) => ({
    name: 'Summer Uniform',
    type: 'Summer',
    boysQty: 100,
    girlsQty: 80,
    components: [{ label: 'Shirt', checked: true }],
    ...overrides,
  });

  const createOpenRfq = (overrides = {}) =>
    rfqService.createRfq(schoolId, {
      title: 'Uniform Request',
      uniformSets: [baseUniformSet()],
      invitedVendorIds: [String(vendorId)],
      quotationDeadline: new Date(Date.now() + 7 * DAY),
      status: 'open',
      ...overrides,
    });

  beforeEach(async () => {
    const school = await School.create({
      code: `RFQ-${Date.now()}`,
      name: 'RFQ Test School',
      schoolRefNo: `RFQ-REF-${Date.now()}`,
      phone: '9000000000',
      address: {
        line1: '1 School Road',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        pinCode: '110001',
      },
    });
    schoolId = school._id;
    schoolAdminUserId = new mongoose.Types.ObjectId();

    const { user, profile } = await createVendorUser({ approvalStatus: 'approved' });
    vendorId = profile._id;
    vendorUserId = user._id;
  });

  // The future-deadline rule lives in the Joi schema (createRfqSchema /
  // updateRfqSchema), enforced at the HTTP boundary before the service ever
  // sees the payload — so it's the schema under test here, not rfqService.
  describe('deadline must be in the future (validator)', () => {
    test('createRfqSchema rejects a past deadline when publishing (open)', () => {
      const { error } = createRfqSchema.validate({
        title: 'Bad Deadline',
        uniformSets: [baseUniformSet()],
        invitedVendorIds: [String(vendorId)],
        quotationDeadline: new Date(Date.now() - DAY),
        status: 'open',
      });
      expect(error).toBeTruthy();
      expect(error.message).toMatch(/future/i);
    });

    test('createRfqSchema defaults status to open, so a past deadline is still rejected without an explicit status', () => {
      const { error } = createRfqSchema.validate({
        title: 'Bad Deadline',
        quotationDeadline: new Date(Date.now() - DAY),
      });
      expect(error).toBeTruthy();
    });

    test('createRfqSchema allows a past deadline on a draft', () => {
      const { error } = createRfqSchema.validate({
        title: 'Draft With Old Deadline',
        quotationDeadline: new Date(Date.now() - DAY),
        status: 'draft',
      });
      expect(error).toBeFalsy();
    });

    test('updateRfqSchema allows a past deadline on a draft, rejects it otherwise', () => {
      const draftResult = updateRfqSchema.validate({
        quotationDeadline: new Date(Date.now() - DAY),
        status: 'draft',
      });
      expect(draftResult.error).toBeFalsy();

      const liveResult = updateRfqSchema.validate({
        quotationDeadline: new Date(Date.now() - DAY),
      });
      expect(liveResult.error).toBeTruthy();
    });

    test('updateRfqSchema accepts status: cancelled', () => {
      const { error } = updateRfqSchema.validate({ status: 'cancelled' });
      expect(error).toBeFalsy();
    });

    test('createRfq (service) actually persists a draft saved with a past deadline', async () => {
      const rfq = await rfqService.createRfq(schoolId, {
        title: 'Draft With Old Deadline',
        quotationDeadline: new Date(Date.now() - DAY),
        status: 'draft',
      });
      expect(rfq.status).toBe('draft');
    });
  });

  describe('cancellation', () => {
    test('an open RFQ can be cancelled, and invited vendors are notified', async () => {
      await Notification.deleteMany({});
      const rfq = await createOpenRfq();

      const cancelled = await rfqService.updateRfq(schoolId, rfq._id, { status: 'cancelled' });
      expect(cancelled.status).toBe('cancelled');

      await new Promise((resolve) => setTimeout(resolve, 50));
      // Notification.payload holds { notification, data } as it was passed to
      // notificationService.sendToUser — data.type is nested under payload.
      const notifications = await Notification.find({ 'payload.data.type': 'rfq_cancelled' }).lean();
      expect(notifications).toHaveLength(1);
      expect(String(notifications[0].userId)).toBe(String(vendorUserId));
    });

    test('a draft cannot be cancelled (delete it instead)', async () => {
      const rfq = await rfqService.createRfq(schoolId, { title: 'Draft', status: 'draft' });
      await expect(
        rfqService.updateRfq(schoolId, rfq._id, { status: 'cancelled' })
      ).rejects.toMatchObject({ code: 'RFQ_CANNOT_CANCEL' });
    });

    test('an awarded RFQ cannot be cancelled', async () => {
      const rfq = await createOpenRfq();
      // awardQuote's own transactional correctness isn't what's under test here
      // (mongodb-memory-server doesn't run as a replica set, so it can't run a
      // real transaction) — just get the RFQ into 'awarded' state directly to
      // exercise updateRfq's cancel guard.
      await Rfq.updateOne({ _id: rfq._id }, { $set: { status: 'awarded' } });

      await expect(
        rfqService.updateRfq(schoolId, rfq._id, { status: 'cancelled' })
      ).rejects.toMatchObject({ code: 'RFQ_CANNOT_CANCEL' });
    });
  });

  describe('editing items once quotes exist', () => {
    test('is blocked once a vendor has quoted', async () => {
      const rfq = await createOpenRfq();
      await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 30 });

      await expect(
        rfqService.updateRfq(schoolId, rfq._id, { uniformSets: [baseUniformSet({ name: 'Winter Uniform' })] })
      ).rejects.toMatchObject({ code: 'RFQ_HAS_QUOTES' });
    });

    test('is allowed before any quote exists', async () => {
      const rfq = await createOpenRfq();
      const updated = await rfqService.updateRfq(schoolId, rfq._id, {
        uniformSets: [baseUniformSet({ name: 'Winter Uniform' })],
      });
      expect(updated.items[0].name).toBe('Winter Uniform');
    });

    test('editing unrelated fields is still allowed once quotes exist', async () => {
      const rfq = await createOpenRfq();
      await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 30 });

      const updated = await rfqService.updateRfq(schoolId, rfq._id, { title: 'Renamed Request' });
      expect(updated.title).toBe('Renamed Request');
    });
  });

  describe('items-required check cannot be bypassed by omitting uniformSets', () => {
    test('publishing a draft that never had real items is blocked even without resending uniformSets', async () => {
      const draft = await rfqService.createRfq(schoolId, { title: 'Bare Draft', status: 'draft' });

      await expect(
        rfqService.updateRfq(schoolId, draft._id, {
          status: 'open',
          invitedVendorIds: [String(vendorId)],
        })
      ).rejects.toMatchObject({ code: 'RFQ_ITEMS_REQUIRED' });
    });

    test('publishing a draft that already has real items works without resending uniformSets', async () => {
      const draft = await rfqService.createRfq(schoolId, {
        title: 'Draft With Items',
        uniformSets: [baseUniformSet()],
        status: 'draft',
      });

      const published = await rfqService.updateRfq(schoolId, draft._id, {
        status: 'open',
        invitedVendorIds: [String(vendorId)],
      });
      expect(published.status).toBe('open');
    });
  });

  describe('rfqNumber generation survives a collision', () => {
    test('retries and succeeds when the generated number collides', async () => {
      const spy = jest.spyOn(rfqNumberUtil, 'generateRfqNumber');
      const collidingNumber = 'RFQ-COLLIDE-0001';
      await Rfq.create({
        schoolId,
        rfqNumber: collidingNumber,
        title: 'Existing',
        category: 'uniform',
        description: 'x',
        items: [{ name: 'x', quantity: 1, uom: 'sets' }],
        status: 'draft',
      });

      spy.mockResolvedValueOnce(collidingNumber).mockResolvedValueOnce('RFQ-COLLIDE-0002');

      const rfq = await rfqService.createRfq(schoolId, { title: 'New One', status: 'draft' });
      expect(rfq.rfqNumber).toBe('RFQ-COLLIDE-0002');
      spy.mockRestore();
    });
  });

  describe('a vendor removed from the invite list keeps visibility into their own quote', () => {
    // The RFQ items can't be touched once a quote exists (fix #4), but the
    // invite list itself still can be — a school swapping which vendor is
    // invited is exactly the scenario that used to lock the original vendor
    // out of their own quote. A second vendor keeps the list non-empty
    // (updateRfq requires at least one invitee for a live RFQ) while dropping
    // the first.
    const swapInvitedVendor = async (rfq) => {
      const { profile: otherVendor } = await createVendorUser({ approvalStatus: 'approved' });
      await rfqService.updateRfq(schoolId, rfq._id, { invitedVendorIds: [String(otherVendor._id)] });
    };

    test('getVendorRfq still resolves after un-inviting a vendor who already quoted', async () => {
      const rfq = await createOpenRfq();
      await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 30 });
      await swapInvitedVendor(rfq);

      const viewed = await rfqService.getVendorRfq(vendorId, rfq._id);
      expect(viewed.vendorQuote).not.toBeNull();
    });

    test('listVendorRfqs still includes it', async () => {
      const rfq = await createOpenRfq();
      await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 30 });
      await swapInvitedVendor(rfq);

      const { data } = await rfqService.listVendorRfqs(vendorId);
      expect(data.map((r) => String(r._id))).toContain(String(rfq._id));
    });

    test('a vendor who was never invited and never quoted still cannot view it', async () => {
      const rfq = await createOpenRfq();
      const { profile: strangerVendor } = await createVendorUser({ approvalStatus: 'approved' });

      await expect(rfqService.getVendorRfq(strangerVendor._id, rfq._id)).rejects.toMatchObject({
        code: 'RFQ_NOT_INVITED',
      });
    });

    test('submitting a NEW quote still requires current invitation, even for a previously-invited vendor', async () => {
      const rfq = await createOpenRfq();
      await swapInvitedVendor(rfq);

      await expect(
        rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 30 })
      ).rejects.toMatchObject({ code: 'RFQ_NOT_INVITED' });
    });
  });

  describe('awardQuote', () => {
    test('rejects without an authenticated actor', async () => {
      const rfq = await createOpenRfq();
      const quote = await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 30 });

      await expect(
        rfqService.awardQuote(schoolId, rfq._id, quote._id)
      ).rejects.toMatchObject({ code: 'ACTOR_REQUIRED' });
    });

    test('accepts the quote, rejects the rest, marks the RFQ awarded, and creates a matching Order', async () => {
      const rfq = await createOpenRfq();
      const winning = await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 30 });

      const { profile: otherVendor } = await createVendorUser({ approvalStatus: 'approved' });
      await rfqService.updateRfq(schoolId, rfq._id, {
        invitedVendorIds: [String(vendorId), String(otherVendor._id)],
      });
      const losing = await rfqService.submitQuote(otherVendor._id, rfq._id, { unitPrice: 600, advancePercent: 20 });

      const result = await rfqService.awardQuote(schoolId, rfq._id, winning._id, { userId: schoolAdminUserId });
      expect(result.orderId).toBeTruthy();
      expect(result.rawStatus || result.status).toBeTruthy();

      const updatedRfq = await Rfq.findById(rfq._id).lean();
      expect(updatedRfq.status).toBe('awarded');
      expect(String(updatedRfq.awardedQuoteId)).toBe(String(winning._id));
      expect(String(updatedRfq.orderId)).toBe(String(result.orderId));

      const winningQuote = await Quote.findById(winning._id).lean();
      expect(winningQuote.status).toBe('accepted');
      const losingQuote = await Quote.findById(losing._id).lean();
      expect(losingQuote.status).toBe('rejected');

      const order = await Order.findById(result.orderId).lean();
      expect(order).toBeTruthy();
      expect(order.audience).toBe('school');
      expect(String(order.userId)).toBe(String(schoolAdminUserId));
      expect(order.paymentStatus).toBe('pending');
      expect(order.totalPaise).toBe(winningQuote.totalPaise);
      expect(order.rfqAdvance.advancePaise).toBe(winningQuote.advanceAmountPaise);
      expect(order.rfqAdvance.remainderPaise).toBe(winningQuote.totalPaise - winningQuote.advanceAmountPaise);
      expect(String(order.items[0].rfqId)).toBe(String(rfq._id));
      expect(String(order.items[0].quoteId)).toBe(String(winning._id));
      expect(String(order.items[0].vendorId)).toBe(String(vendorId));
    });

    test('an RFQ that is not open/reviewing cannot be awarded', async () => {
      const rfq = await createOpenRfq();
      const quote = await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 30 });
      await Rfq.updateOne({ _id: rfq._id }, { $set: { status: 'cancelled' } });

      await expect(
        rfqService.awardQuote(schoolId, rfq._id, quote._id, { userId: schoolAdminUserId })
      ).rejects.toMatchObject({ code: 'RFQ_CANNOT_AWARD' });
    });
  });

  describe('advance / remainder payment lifecycle', () => {
    const awardedOrder = async (advancePercent = 40) => {
      const rfq = await createOpenRfq();
      const quote = await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent });
      const awarded = await rfqService.awardQuote(schoolId, rfq._id, quote._id, { userId: schoolAdminUserId });
      return { rfq, quote, orderId: awarded.orderId };
    };

    test('initiateAdvancePayment creates a payment for exactly the advance amount', async () => {
      const { orderId, quote } = await awardedOrder(40);

      const { payment } = await rfqService.initiateAdvancePayment(schoolId, orderId);
      expect(payment.amountPaise).toBe(quote.advanceAmountPaise);

      const order = await Order.findById(orderId).lean();
      expect(String(order.paymentId)).toBe(String(payment._id));
    });

    test('initiateAdvancePayment cannot run twice', async () => {
      const { orderId } = await awardedOrder(40);
      await rfqService.initiateAdvancePayment(schoolId, orderId);

      await expect(
        rfqService.initiateAdvancePayment(schoolId, orderId)
      ).rejects.toMatchObject({ code: 'ADVANCE_ALREADY_INITIATED' });
    });

    test('confirmAdvancePayment moves the order to partially_paid, not paid', async () => {
      const { orderId } = await awardedOrder(40);
      await rfqService.initiateAdvancePayment(schoolId, orderId);

      const { order } = await rfqService.confirmAdvancePayment(schoolId, orderId);
      expect(order.paymentStatus).toBe('partially_paid');
    });

    test('confirmAdvancePayment without initiating first is rejected', async () => {
      const { orderId } = await awardedOrder(40);

      await expect(
        rfqService.confirmAdvancePayment(schoolId, orderId)
      ).rejects.toMatchObject({ code: 'ADVANCE_NOT_INITIATED' });
    });

    test('the remainder cannot be paid before the advance', async () => {
      const { orderId } = await awardedOrder(40);

      await expect(
        rfqService.initiateRemainderPayment(schoolId, orderId)
      ).rejects.toMatchObject({ code: 'ADVANCE_NOT_PAID' });
    });

    test('initiateRemainderPayment cannot run twice while the first is still uncaptured', async () => {
      const { orderId } = await awardedOrder(40);
      await rfqService.initiateAdvancePayment(schoolId, orderId);
      await rfqService.confirmAdvancePayment(schoolId, orderId);

      await rfqService.initiateRemainderPayment(schoolId, orderId);
      await expect(
        rfqService.initiateRemainderPayment(schoolId, orderId)
      ).rejects.toMatchObject({ code: 'REMAINDER_ALREADY_INITIATED' });
    });

    test('full advance -> remainder lifecycle settles the order at "paid" for the full quote total', async () => {
      const { orderId, quote } = await awardedOrder(40);

      await rfqService.initiateAdvancePayment(schoolId, orderId);
      await rfqService.confirmAdvancePayment(schoolId, orderId);

      const { payment: remainderPayment } = await rfqService.initiateRemainderPayment(schoolId, orderId);
      expect(remainderPayment.amountPaise).toBe(quote.totalPaise - quote.advanceAmountPaise);

      const { order } = await rfqService.confirmRemainderPayment(schoolId, orderId);
      expect(order.paymentStatus).toBe('paid');
      expect(order.rfqAdvance.remainderPaidAt).toBeTruthy();

      // Fully settling twice is a no-op, not an error — the UI may re-fire this.
      await expect(rfqService.initiateRemainderPayment(schoolId, orderId)).rejects.toMatchObject({
        code: 'ORDER_ALREADY_PAID',
      });
      await expect(rfqService.confirmRemainderPayment(schoolId, orderId)).resolves.toMatchObject({
        order: expect.objectContaining({ paymentStatus: 'paid' }),
      });
    });

    test('a 0% advance settles instantly with no gateway round-trip', async () => {
      const { orderId } = await awardedOrder(0);

      const { payment } = await rfqService.initiateAdvancePayment(schoolId, orderId);
      expect(payment.amountPaise).toBe(0);
      expect(payment.status).toBe('captured');

      const order = await Order.findById(orderId).lean();
      expect(order.paymentStatus).toBe('partially_paid');
    });

    test('a school cannot reach another school\'s order', async () => {
      const { orderId } = await awardedOrder(40);
      const otherSchool = await School.create({
        code: `OTHER-${Date.now()}`,
        name: 'Other School',
        schoolRefNo: `OTHER-REF-${Date.now()}`,
      });

      await expect(
        rfqService.initiateAdvancePayment(otherSchool._id, orderId)
      ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
    });
  });

  describe('quotation management dashboard surfaces order/payment status', () => {
    test('getSchoolRfq includes the order summary once awarded', async () => {
      const rfq = await createOpenRfq();
      const quote = await rfqService.submitQuote(vendorId, rfq._id, { unitPrice: 500, advancePercent: 40 });
      await rfqService.awardQuote(schoolId, rfq._id, quote._id, { userId: schoolAdminUserId });

      const fetched = await rfqService.getSchoolRfq(schoolId, rfq._id);
      expect(fetched.order).toBeTruthy();
      expect(fetched.order.paymentStatus).toBe('pending');
      expect(fetched.order.advancePaise).toBe(quote.advanceAmountPaise);
    });

    test('listSchoolRfqs batches order summaries for every awarded RFQ, leaves others null', async () => {
      const awardedRfq = await createOpenRfq({ title: 'Awarded One' });
      const awardedQuote = await rfqService.submitQuote(vendorId, awardedRfq._id, { unitPrice: 500, advancePercent: 25 });
      await rfqService.awardQuote(schoolId, awardedRfq._id, awardedQuote._id, { userId: schoolAdminUserId });

      const unawardedRfq = await createOpenRfq({ title: 'Still Open' });

      const { data } = await rfqService.listSchoolRfqs(schoolId);
      const awardedRow = data.find((r) => String(r._id) === String(awardedRfq._id));
      const openRow = data.find((r) => String(r._id) === String(unawardedRfq._id));

      expect(awardedRow.order).toBeTruthy();
      expect(awardedRow.order.paymentStatus).toBe('pending');
      expect(openRow.order).toBeNull();
    });
  });
});
