const asyncHandler = require('../../../utils/asyncHandler');
const { success, created, paginated } = require('../../../common/response');
const supportService = require('../services/support.service');

const supportController = {
  listTopics: asyncHandler(async (req, res) => {
    const topics = await supportService.listTopics(req.query);
    return success(res, { topics }, 'Support topics fetched', undefined, req);
  }),

  createTicket: asyncHandler(async (req, res) => {
    const ticket = await supportService.createTicket(req.auth.userId, req.body);
    return created(res, { ticket }, 'Support ticket created', req);
  }),

  listMyTickets: asyncHandler(async (req, res) => {
    const { data, pagination } = await supportService.listTickets({
      userId: req.auth.userId,
      isAdmin: false,
      query: req.query,
    });
    return paginated(res, { tickets: data }, pagination, 'Tickets fetched', req);
  }),

  getMyTicket: asyncHandler(async (req, res) => {
    const ticket = await supportService.getTicket(req.auth.userId, req.params.ticketId, {
      isAdmin: false,
    });
    return success(res, { ticket }, 'Ticket fetched', undefined, req);
  }),

  replyToMyTicket: asyncHandler(async (req, res) => {
    const ticket = await supportService.replyToTicket({
      userId: req.auth.userId,
      ticketId: req.params.ticketId,
      body: req.body.body,
      isAdmin: false,
    });
    return success(res, { ticket }, 'Reply sent', undefined, req);
  }),

  // Admin
  listAllTickets: asyncHandler(async (req, res) => {
    const { data, pagination } = await supportService.listTickets({
      userId: req.auth.userId,
      isAdmin: true,
      query: req.query,
    });
    return paginated(res, { tickets: data }, pagination, 'Tickets fetched', req);
  }),

  getTicketAdmin: asyncHandler(async (req, res) => {
    const ticket = await supportService.getTicket(req.auth.userId, req.params.ticketId, {
      isAdmin: true,
    });
    return success(res, { ticket }, 'Ticket fetched', undefined, req);
  }),

  replyAsAdmin: asyncHandler(async (req, res) => {
    const ticket = await supportService.replyToTicket({
      userId: req.auth.userId,
      ticketId: req.params.ticketId,
      body: req.body.body,
      isAdmin: true,
    });
    return success(res, { ticket }, 'Reply sent', undefined, req);
  }),

  updateTicketStatus: asyncHandler(async (req, res) => {
    const result = await supportService.updateStatus({
      ticketId: req.params.ticketId,
      status: req.body.status,
      assignedTo: req.body.assignedTo,
    });
    return success(res, result, 'Ticket status updated', undefined, req);
  }),
};

module.exports = supportController;
