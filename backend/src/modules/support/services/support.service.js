const crypto = require('crypto');
const SupportMessage = require('../../../database/models/SupportMessage');
const SupportTopic = require('../../../database/models/SupportTopic');
const { executePaginatedQuery } = require('../../../repositories');
const { NotFoundError, ForbiddenError } = require('../../../common/errors');

const generateTicketId = () =>
  `TKT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

const notDeleted = { 'softDelete.isDeleted': { $ne: true } };

const GENERAL_TOPIC_SLUG = 'general-enquiry';

const supportService = {
  async listTopics(query = {}) {
    const filter = { status: 'active' };
    if (query.audience) filter.audience = query.audience;
    return SupportTopic.find(filter).sort({ displayOrder: 1, name: 1 }).lean();
  },

  /**
   * The contact form submits without a topic, so fall back to a general-enquiry
   * topic, creating it on first use rather than depending on seed data.
   */
  async getDefaultTopic() {
    const existing = await SupportTopic.findOne({ slug: GENERAL_TOPIC_SLUG }).lean();
    if (existing) {
      if (existing.status !== 'active') {
        await SupportTopic.updateOne({ _id: existing._id }, { $set: { status: 'active' } });
      }
      return existing;
    }

    // Concurrent first-time submissions can race here; the unique slug index makes
    // the loser's insert fail, so fall back to re-reading the winner's document.
    try {
      const created = await SupportTopic.create({
        name: 'General Enquiry',
        slug: GENERAL_TOPIC_SLUG,
        audience: 'general',
        displayOrder: 0,
        status: 'active',
      });
      return created.toObject();
    } catch (error) {
      if (error?.code === 11000) {
        return SupportTopic.findOne({ slug: GENERAL_TOPIC_SLUG }).lean();
      }
      throw error;
    }
  },

  /** Open a new ticket; the initial message's sender becomes the ticket owner. */
  async createTicket(userId, { topicId, subject, body, contact, reference }) {
    let topic;
    if (topicId) {
      topic = await SupportTopic.findById(topicId).lean();
      if (!topic || topic.status !== 'active') {
        throw new NotFoundError('Support topic not found');
      }
    } else {
      topic = await this.getDefaultTopic();
    }

    const ticketId = generateTicketId();
    await SupportMessage.create({
      ticketId,
      senderUserId: userId,
      topicId: topic._id,
      subject,
      body,
      contact,
      reference,
      status: 'open',
      isReadByCustomer: true,
    });

    return this.getTicket(userId, ticketId, { isAdmin: false });
  },

  /** Aggregate messages into ticket summaries scoped to their owner (or all for admin). */
  async listTickets({ userId, isAdmin = false, query = {} }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));

    const ownerMatch = {};
    const pipeline = [
      { $match: notDeleted },
      { $sort: { 'audit.createdAt': 1 } },
      {
        $group: {
          _id: '$ticketId',
          ticketId: { $first: '$ticketId' },
          ownerUserId: { $first: '$senderUserId' },
          topicId: { $first: '$topicId' },
          subject: { $first: '$subject' },
          lastMessage: { $last: '$body' },
          status: { $last: '$status' },
          assignedTo: { $last: '$assignedTo' },
          isReadByCustomer: { $last: '$isReadByCustomer' },
          messageCount: { $sum: 1 },
          createdAt: { $first: '$audit.createdAt' },
          updatedAt: { $last: '$audit.createdAt' },
        },
      },
    ];

    if (!isAdmin) {
      pipeline.push({ $match: { ownerUserId: userId } });
    }
    if (query.status) {
      pipeline.push({ $match: { status: query.status } });
    }

    pipeline.push({ $sort: { updatedAt: -1 } });

    const facet = await SupportMessage.aggregate([
      ...pipeline,
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const data = facet[0]?.data || [];
    const total = facet[0]?.total?.[0]?.count || 0;

    return {
      data,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 },
    };
  },

  async getTicket(userId, ticketId, { isAdmin = false } = {}) {
    const messages = await SupportMessage.find({ ticketId, ...notDeleted })
      .sort({ 'audit.createdAt': 1 })
      .lean();

    if (!messages.length) {
      throw new NotFoundError('Ticket not found');
    }

    const ownerUserId = String(messages[0].senderUserId);
    if (!isAdmin && ownerUserId !== String(userId)) {
      throw new ForbiddenError('You cannot access this ticket');
    }

    const last = messages[messages.length - 1];
    return {
      ticketId,
      ownerUserId,
      topicId: messages[0].topicId,
      subject: messages[0].subject,
      status: last.status,
      assignedTo: last.assignedTo,
      messages,
    };
  },

  async replyToTicket({ userId, ticketId, body, isAdmin = false }) {
    const existing = await SupportMessage.find({ ticketId, ...notDeleted })
      .sort({ 'audit.createdAt': 1 })
      .lean();
    if (!existing.length) {
      throw new NotFoundError('Ticket not found');
    }

    const ownerUserId = String(existing[0].senderUserId);
    if (!isAdmin && ownerUserId !== String(userId)) {
      throw new ForbiddenError('You cannot reply to this ticket');
    }

    const base = existing[0];
    await SupportMessage.create({
      ticketId,
      senderUserId: userId,
      topicId: base.topicId,
      subject: base.subject,
      body,
      status: isAdmin ? 'pending_customer' : 'open',
      assignedTo: isAdmin ? userId : base.assignedTo,
      isReadByCustomer: !isAdmin,
    });

    return this.getTicket(userId, ticketId, { isAdmin });
  },

  async updateStatus({ ticketId, status, assignedTo }) {
    const result = await SupportMessage.updateMany(
      { ticketId, ...notDeleted },
      { $set: { status, ...(assignedTo ? { assignedTo } : {}) } }
    );
    if (!result.matchedCount) {
      throw new NotFoundError('Ticket not found');
    }
    return { ticketId, status };
  },
};

module.exports = supportService;
