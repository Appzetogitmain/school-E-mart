const express = require('express');
const supportController = require('../controllers/support.controller');
const validators = require('../validators/support.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');
const { ROLES } = require('../../../constants/roles');

const router = express.Router();

const authed = protectedRoute();
const adminOnly = protectedRoute({ roles: [ROLES.SUPER_ADMIN], scopes: ['*'] });

// Public-ish (authenticated) topic listing
router.get('/topics', ...authed, validateQuery(validators.topicsQuery), supportController.listTopics);

// Admin ticket management (declared before the customer :ticketId routes)
router.get(
  '/admin/tickets',
  ...adminOnly,
  validateQuery(validators.paginationQuery),
  supportController.listAllTickets
);
router.get(
  '/admin/tickets/:ticketId',
  ...adminOnly,
  validateParams(validators.ticketIdParam),
  supportController.getTicketAdmin
);
router.post(
  '/admin/tickets/:ticketId/reply',
  ...adminOnly,
  validateParams(validators.ticketIdParam),
  validateBody(validators.replySchema),
  supportController.replyAsAdmin
);
router.patch(
  '/admin/tickets/:ticketId/status',
  ...adminOnly,
  validateParams(validators.ticketIdParam),
  validateBody(validators.updateStatusSchema),
  supportController.updateTicketStatus
);

// Customer tickets
router.get('/tickets', ...authed, validateQuery(validators.paginationQuery), supportController.listMyTickets);
router.post('/tickets', ...authed, validateBody(validators.createTicketSchema), supportController.createTicket);
router.get(
  '/tickets/:ticketId',
  ...authed,
  validateParams(validators.ticketIdParam),
  supportController.getMyTicket
);
router.post(
  '/tickets/:ticketId/messages',
  ...authed,
  validateParams(validators.ticketIdParam),
  validateBody(validators.replySchema),
  supportController.replyToMyTicket
);

module.exports = router;
