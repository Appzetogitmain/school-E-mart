const asyncHandler = require('../../../utils/asyncHandler');
const { success, created, paginated } = require('../../../common/response');
const { tokenService, notificationService } = require('../../../services/notification');

const notificationsController = {
  registerToken: asyncHandler(async (req, res) => {
    const record = await tokenService.registerToken({
      userId: req.auth.userId,
      token: req.body.token,
      platform: req.body.platform,
      deviceId: req.body.deviceId,
      userAgent: req.headers['user-agent'],
    });
    return created(res, { token: record }, 'FCM token registered', req);
  }),

  unregisterToken: asyncHandler(async (req, res) => {
    await tokenService.unregisterToken({
      userId: req.auth.userId,
      token: req.body.token,
      deviceId: req.body.deviceId,
    });
    return success(res, null, 'FCM token removed', undefined, req);
  }),

  listNotifications: asyncHandler(async (req, res) => {
    const result = await notificationService.listForUser(req.auth.userId, req.query);
    return paginated(res, result.items, result.pagination, 'Notifications fetched', req);
  }),

  getUnreadCount: asyncHandler(async (req, res) => {
    const count = await notificationService.getUnreadCount(req.auth.userId);
    return success(res, { count }, 'Unread count fetched', undefined, req);
  }),

  markAsRead: asyncHandler(async (req, res) => {
    const notification = await notificationService.markAsRead(
      req.auth.userId,
      req.params.notificationId
    );
    return success(res, { notification }, 'Notification marked as read', undefined, req);
  }),

  markAllAsRead: asyncHandler(async (req, res) => {
    const result = await notificationService.markAllAsRead(req.auth.userId);
    return success(res, result, 'All notifications marked as read', undefined, req);
  }),
};

module.exports = notificationsController;
