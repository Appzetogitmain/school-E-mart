const express = require('express');
const notificationsController = require('../controllers/notifications.controller');
const validators = require('../validators/notifications.validator');
const { validateBody, validateParams, validateQuery } = require('../../../middlewares/validation');
const { protectedRoute } = require('../../../middlewares/auth/guards');

const router = express.Router();

router.post(
  '/tokens',
  ...protectedRoute(),
  validateBody(validators.registerTokenSchema),
  notificationsController.registerToken
);

router.delete(
  '/tokens',
  ...protectedRoute(),
  validateBody(validators.unregisterTokenSchema),
  notificationsController.unregisterToken
);

router.get(
  '/',
  ...protectedRoute(),
  validateQuery(validators.listNotificationsSchema),
  notificationsController.listNotifications
);

router.get('/unread-count', ...protectedRoute(), notificationsController.getUnreadCount);

router.patch(
  '/:notificationId/read',
  ...protectedRoute(),
  validateParams(validators.notificationIdParamsSchema),
  notificationsController.markAsRead
);

router.patch('/read-all', ...protectedRoute(), notificationsController.markAllAsRead);

module.exports = router;
