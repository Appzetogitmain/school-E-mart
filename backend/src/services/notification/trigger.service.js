const logger = require('../../common/logger');
const notificationService = require('./notification.service');
const VendorProfile = require('../../database/models/VendorProfile');
const ChildProfile = require('../../database/models/ChildProfile');
const Order = require('../../database/models/Order');

const notifySafe = (fn, ...args) => {
  Promise.resolve()
    .then(() => fn(...args))
    .catch((error) => {
      logger.error('Notification trigger failed', {
        handler: fn.name,
        message: error.message,
      });
    });
};

const orderRoute = (order, audience) => {
  if (audience === 'school' || order?.audience === 'school') {
    return `/school/orders/${order._id}`;
  }
  return `/user/orders/${order._id}`;
};

const vendorOrderRoute = (orderId) => `/vendor/orders/${orderId}`;

const getVendorUserIds = async (vendorIds = []) => {
  const profiles = await VendorProfile.find({ _id: { $in: vendorIds } })
    .select('userId')
    .lean();
  return profiles.map((p) => p.userId).filter(Boolean);
};

const getSchoolParentUserIds = async (schoolId, notice) => {
  const Student = require('../../database/models/Student');

  if (notice?.targetAudience === 'specific_classes' && notice.targetClasses?.length) {
    const classFilters = notice.targetClasses.map((entry) => {
      const filter = {
        schoolId,
        classGrade: entry.classGrade,
        status: 'active',
        'softDelete.isDeleted': { $ne: true },
      };
      if (entry.sections?.length) {
        filter.section = { $in: entry.sections };
      }
      return filter;
    });

    const students = await Student.find({ $or: classFilters }).select('_id').lean();
    const studentIds = students.map((s) => s._id);

    const children = await ChildProfile.find({
      studentId: { $in: studentIds },
      'softDelete.isDeleted': { $ne: true },
    })
      .select('parentUserId')
      .lean();

    return [...new Set(children.map((c) => String(c.parentUserId)))];
  }

  const children = await ChildProfile.find({
    schoolId,
    'softDelete.isDeleted': { $ne: true },
  })
    .select('parentUserId')
    .lean();

  return [...new Set(children.map((c) => String(c.parentUserId)))];
};

const triggerService = {
  notifyOrderPlaced(order) {
    notifySafe(async () => {
      await notificationService.sendToUser(order.userId, {
        type: 'order_update',
        notification: {
          title: 'Order Placed',
          body: `Your order #${order.orderNumber} has been placed successfully.`,
        },
        data: {
          type: 'order_placed',
          route: orderRoute(order),
          entityId: String(order._id),
          orderNumber: order.orderNumber,
        },
      });

      const vendorUserIds = await getVendorUserIds(order.vendorIds || []);
      await notificationService.sendToUsers(vendorUserIds, {
        type: 'order_update',
        notification: {
          title: 'New Order',
          body: `New order #${order.orderNumber} received.`,
        },
        data: {
          type: 'order_new',
          route: vendorOrderRoute(order._id),
          entityId: String(order._id),
          orderNumber: order.orderNumber,
        },
      });
    });
  },

  notifyOrderStatusChange(order, status, note) {
    notifySafe(async () => {
      const statusLabels = {
        accepted: 'accepted',
        processed: 'being processed',
        packed: 'packed',
        shipped: 'shipped',
        out_for_delivery: 'out for delivery',
        delivered: 'delivered',
        cancelled: 'cancelled',
      };
      const label = statusLabels[status] || status;

      await notificationService.sendToUser(order.userId, {
        type: 'order_update',
        notification: {
          title: 'Order Update',
          body: `Order #${order.orderNumber} is ${label}.${note ? ` ${note}` : ''}`,
        },
        data: {
          type: 'order_status',
          route: orderRoute(order),
          entityId: String(order._id),
          status,
          orderNumber: order.orderNumber,
        },
      });
    });
  },

  notifyOrderCancelled(order, cancelledByRole) {
    notifySafe(async () => {
      await notificationService.sendToUser(order.userId, {
        type: 'order_update',
        notification: {
          title: 'Order Cancelled',
          body: `Order #${order.orderNumber} has been cancelled.`,
        },
        data: {
          type: 'order_cancelled',
          route: orderRoute(order),
          entityId: String(order._id),
          cancelledBy: cancelledByRole,
        },
      });

      const vendorUserIds = await getVendorUserIds(order.vendorIds || []);
      await notificationService.sendToUsers(vendorUserIds, {
        type: 'order_update',
        notification: {
          title: 'Order Cancelled',
          body: `Order #${order.orderNumber} was cancelled.`,
        },
        data: {
          type: 'order_cancelled',
          route: vendorOrderRoute(order._id),
          entityId: String(order._id),
        },
      });
    });
  },

  notifyPaymentSuccess(order) {
    notifySafe(async () => {
      await notificationService.sendToUser(order.userId, {
        type: 'order_update',
        notification: {
          title: 'Payment Successful',
          body: `Payment for order #${order.orderNumber} was successful.`,
        },
        data: {
          type: 'payment_success',
          route: orderRoute(order),
          entityId: String(order._id),
          orderNumber: order.orderNumber,
        },
      });
    });
  },

  notifyPaymentFailed(order, reason) {
    notifySafe(async () => {
      await notificationService.sendToUser(order.userId, {
        type: 'order_update',
        notification: {
          title: 'Payment Failed',
          body: reason || `Payment for order #${order.orderNumber} failed. Please retry.`,
        },
        data: {
          type: 'payment_failed',
          route: orderRoute(order),
          entityId: String(order._id),
          orderNumber: order.orderNumber,
        },
      });
    });
  },

  notifyVendorOrderAction(order, vendorId, action) {
    notifySafe(async () => {
      const titles = {
        accepted: 'Order Accepted',
        rejected: 'Order Rejected',
        processed: 'Order Processing',
        packed: 'Order Packed',
        shipped: 'Order Shipped',
      };
      const bodies = {
        accepted: `Vendor accepted order #${order.orderNumber}.`,
        rejected: `Vendor rejected order #${order.orderNumber}.`,
        processed: `Order #${order.orderNumber} is being processed.`,
        packed: `Order #${order.orderNumber} has been packed.`,
        shipped: `Order #${order.orderNumber} has been shipped.`,
      };

      await notificationService.sendToUser(order.userId, {
        type: 'order_update',
        notification: {
          title: titles[action] || 'Order Update',
          body: bodies[action] || `Order #${order.orderNumber} updated.`,
        },
        data: {
          type: `vendor_${action}`,
          route: orderRoute(order),
          entityId: String(order._id),
          vendorId: String(vendorId),
        },
      });
    });
  },

  notifySchoolNoticePublished(schoolId, notice) {
    notifySafe(async () => {
      const parentUserIds = await getSchoolParentUserIds(schoolId, notice);
      if (!parentUserIds.length) return;

      await notificationService.sendToUsers(parentUserIds, {
        type: 'school_notice',
        notification: {
          title: notice.title || 'School Notice',
          body: notice.content?.slice(0, 120) || 'A new notice has been published.',
        },
        data: {
          type: 'school_notice',
          route: '/user/notifications',
          entityId: String(notice._id),
          schoolId: String(schoolId),
        },
      });
    });
  },

  notifyUserAction(userId, { title, body, type = 'system', route, entityId, extra }) {
    notifySafe(async () => {
      await notificationService.sendToUser(userId, {
        type,
        notification: { title, body },
        data: {
          type: type,
          route: route || '/user/notifications',
          entityId: entityId ? String(entityId) : '',
          extra: extra ? JSON.stringify(extra) : '',
        },
      });
    });
  },

  notifyDeliveryUpdate(orderMongoId, status, orderNumber) {
    notifySafe(async () => {
      const order = await Order.findById(orderMongoId).select('userId audience _id orderNumber').lean();
      if (!order) return;

      await notificationService.sendToUser(order.userId, {
        type: 'order_update',
        notification: {
          title: 'Delivery Update',
          body: `Order #${orderNumber || order.orderNumber} — ${status?.replace(/_/g, ' ') || 'updated'}.`,
        },
        data: {
          type: 'delivery_update',
          route: orderRoute(order),
          entityId: String(order._id),
          status: status || '',
        },
      });
    });
  },

  notifyRefundUpdate(order, status) {
    notifySafe(async () => {
      await notificationService.sendToUser(order.userId, {
        type: 'order_update',
        notification: {
          title: 'Refund Update',
          body: `Refund for order #${order.orderNumber} is ${status}.`,
        },
        data: {
          type: 'refund_update',
          route: orderRoute(order),
          entityId: String(order._id),
          status,
        },
      });
    });
  },
};

module.exports = triggerService;
