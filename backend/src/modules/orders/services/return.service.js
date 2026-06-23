const { NotFoundError, BadRequestError } = require('../../../common/errors');
const ReturnRequest = require('../../../database/models/ReturnRequest');
const returnRepository = require('../repositories/return.repository');
const orderService = require('./order.service');
const inventoryService = require('./inventory.service');
const { RETURN_ELIGIBLE } = require('../utils/statusMachine');
const { runAtomic } = require('../utils/atomic');

const returnService = {
  async createReturn(userId, orderId, { orderItemIndex, reason, description, attachments = [] }) {
    const order = await orderService.getOrder(orderId);
    if (String(order.userId) !== String(userId)) {
      throw new BadRequestError('You can only return your own orders', null, 'RETURN_ACCESS_DENIED');
    }
    if (!RETURN_ELIGIBLE.has(order.orderStatus)) {
      throw new BadRequestError(
        'Returns are only allowed for delivered orders',
        null,
        'RETURN_NOT_ELIGIBLE'
      );
    }

    const item = order.items[orderItemIndex];
    if (!item) throw new BadRequestError('Invalid order item index', null, 'INVALID_ORDER_ITEM');

    const existing = await returnRepository.findOne({
      orderId,
      orderItemIndex,
      status: { $nin: ['rejected', 'completed'] },
    });
    if (existing) {
      throw new BadRequestError('Return already requested for this item', null, 'RETURN_ALREADY_EXISTS');
    }

    return ReturnRequest.create({
      orderId,
      orderItemIndex,
      userId,
      vendorId: item.vendorId,
      productSnapshot: {
        name: item.name,
        sku: item.sku,
        image: item.image,
        pricePaise: item.pricePaise,
        quantity: item.quantity,
      },
      reason,
      description,
      attachments,
      status: 'requested',
      qcStatus: 'pending',
      timeline: [{ status: 'requested', at: new Date(), note: reason, byUserId: userId }],
    });
  },

  listUserReturns(userId, query) {
    const filter = {};
    if (query.status) filter.status = query.status;
    return returnRepository.paginateUserReturns(userId, query, filter);
  },

  async getReturn(userId, returnId) {
    const returnRequest = await returnRepository.findUserReturn(userId, returnId);
    if (!returnRequest) throw new NotFoundError('Return request not found', 'RETURN_NOT_FOUND');
    return returnRequest;
  },

  async completeReturn(returnId, actor) {
    const returnRequest = await returnRepository.findById(returnId);
    if (!returnRequest) throw new NotFoundError('Return request not found', 'RETURN_NOT_FOUND');
    if (returnRequest.status === 'completed') return returnRequest;

    return runAtomic(async (session) => {
      const order = await orderService.getOrder(returnRequest.orderId);
      const item = order.items[returnRequest.orderItemIndex];

      await inventoryService.restoreStock([item], session);

      const updated = await ReturnRequest.findByIdAndUpdate(
        returnId,
        {
          $set: { status: 'completed', qcStatus: 'passed' },
          $push: {
            timeline: {
              status: 'completed',
              at: new Date(),
              note: 'Return completed',
              byUserId: actor.userId,
            },
          },
        },
        { new: true, ...(session ? { session } : {}) }
      ).lean();

      await orderService.transitionStatus(
        order._id,
        { status: 'returned', note: 'Item returned' },
        actor,
        { force: true }
      );

      return updated;
    });
  },
};

module.exports = returnService;
