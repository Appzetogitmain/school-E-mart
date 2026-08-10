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

const parentUserIdsForStudents = async (studentIds) => {
  if (!studentIds?.length) return [];

  const ChildProfile = require('../../database/models/ChildProfile');
  const Student = require('../../database/models/Student');
  const ParentProfile = require('../../database/models/ParentProfile');

  // Method A: parentUserId from ChildProfile
  const children = await ChildProfile.find({
    studentId: { $in: studentIds },
    'softDelete.isDeleted': { $ne: true },
  })
    .select('parentUserId')
    .lean();

  const userIdsA = children.map((c) => String(c.parentUserId)).filter(Boolean);

  // Method B: parentProfileIds from Student -> ParentProfile.userId
  const students = await Student.find({
    _id: { $in: studentIds },
    'softDelete.isDeleted': { $ne: true },
  })
    .select('parentProfileIds')
    .lean();

  const parentProfileIds = students.flatMap((s) => s.parentProfileIds || []).filter(Boolean);
  let userIdsB = [];
  if (parentProfileIds.length) {
    const parentProfiles = await ParentProfile.find({
      _id: { $in: parentProfileIds },
      'softDelete.isDeleted': { $ne: true },
    })
      .select('userId')
      .lean();
    userIdsB = parentProfiles.map((p) => String(p.userId)).filter(Boolean);
  }

  return [...new Set([...userIdsA, ...userIdsB])];
};

/**
 * Parents of every active student in the given classes. `targets` is a list of
 * { classGrade, sections? } — omitting sections means the whole grade.
 */
const getParentUserIdsForClasses = async (schoolId, targets = []) => {
  const Student = require('../../database/models/Student');
  if (!targets.length) return [];

  const classFilters = targets.map((entry) => {
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
  return parentUserIdsForStudents(students.map((s) => s._id));
};

const getSchoolStaffUserIds = async (schoolId) => {
  const User = require('../../database/models/User');
  const users = await User.find({
    role: 'school',
    tenantSchoolId: schoolId,
    'softDelete.isDeleted': { $ne: true },
  })
    .select('_id')
    .lean();
  return users.map((u) => String(u._id));
};

const getSchoolParentUserIds = async (schoolId, notice) => {
  if (notice?.targetAudience === 'specific_classes' && notice.targetClasses?.length) {
    return getParentUserIdsForClasses(schoolId, notice.targetClasses);
  }

  const ChildProfile = require('../../database/models/ChildProfile');
  const Student = require('../../database/models/Student');
  const ParentProfile = require('../../database/models/ParentProfile');

  // Method A: parentUserId from ChildProfile with this schoolId
  const children = await ChildProfile.find({
    schoolId,
    'softDelete.isDeleted': { $ne: true },
  })
    .select('parentUserId')
    .lean();
  const userIdsA = children.map((c) => String(c.parentUserId)).filter(Boolean);

  // Method B: Student records with this schoolId -> ParentProfile.userId
  const students = await Student.find({
    schoolId,
    status: 'active',
    'softDelete.isDeleted': { $ne: true },
  })
    .select('parentProfileIds')
    .lean();
  const parentProfileIds = students.flatMap((s) => s.parentProfileIds || []).filter(Boolean);
  let userIdsB = [];
  if (parentProfileIds.length) {
    const parentProfiles = await ParentProfile.find({
      _id: { $in: parentProfileIds },
      'softDelete.isDeleted': { $ne: true },
    })
      .select('userId')
      .lean();
    userIdsB = parentProfiles.map((p) => String(p.userId)).filter(Boolean);
  }

  return [...new Set([...userIdsA, ...userIdsB])];
};

const HOMEWORK_PARENT_ROUTE = '/parent/homework';

const triggerService = {
  notifyOrderPlaced(order) {
    notifySafe(async () => {
      // 1. Notify Buyer
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

      // 2. Notify Vendor(s)
      const vendorUserIds = await getVendorUserIds(order.vendorIds || []);
      if (vendorUserIds.length) {
        await notificationService.sendToUsers(vendorUserIds, {
          type: 'order_update',
          notification: {
            title: 'New Order Received',
            body: `New order #${order.orderNumber} received.`,
          },
          data: {
            type: 'order_new',
            route: vendorOrderRoute(order._id),
            entityId: String(order._id),
            orderNumber: order.orderNumber,
          },
        });
      }

      // 3. If School Bulk Order, Notify School Admin / Staff
      if (order.audience === 'school' && order.schoolId) {
        const schoolStaffUserIds = await getSchoolStaffUserIds(order.schoolId);
        if (schoolStaffUserIds.length) {
          await notificationService.sendToUsers(schoolStaffUserIds, {
            type: 'order_update',
            notification: {
              title: 'School Bulk Order Placed',
              body: `Bulk order #${order.orderNumber} has been placed for your school.`,
            },
            data: {
              type: 'school_order_placed',
              route: `/school/orders/${order._id}`,
              entityId: String(order._id),
              orderNumber: order.orderNumber,
            },
          });
        }
      }
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
      let recipientUserIds = [];

      const audience = notice?.targetAudience;
      if (audience === 'teachers' || audience === 'staff') {
        recipientUserIds = await getSchoolStaffUserIds(schoolId);
      } else if (audience === 'all') {
        const parents = await getSchoolParentUserIds(schoolId, notice);
        const staff = await getSchoolStaffUserIds(schoolId);
        recipientUserIds = [...new Set([...parents, ...staff])];
      } else {
        recipientUserIds = await getSchoolParentUserIds(schoolId, notice);
      }

      if (!recipientUserIds.length) return;

      await notificationService.sendToUsers(recipientUserIds, {
        type: 'school_notice',
        notification: {
          title: notice.title || 'School Notice',
          body: notice.content?.slice(0, 120) || 'A new notice has been published.',
        },
        data: {
          type: 'school_notice',
          route: '/school/parent/notices',
          entityId: String(notice._id),
          schoolId: String(schoolId),
        },
      });
    });
  },

  notifyHomeworkPublished(schoolId, assignment, course) {
    notifySafe(async () => {
      const classGrade = assignment.classGrade || course?.gradeClass;
      if (!classGrade) return;

      // A homework targets one section; with no section it applies to the whole grade.
      const parentUserIds = await getParentUserIdsForClasses(schoolId, [
        { classGrade, sections: assignment.section ? [assignment.section] : [] },
      ]);

      // Resolve student user accounts for this class/section as well
      const Student = require('../../database/models/Student');
      const studentFilter = {
        schoolId,
        status: 'active',
        'softDelete.isDeleted': { $ne: true },
      };
      if (classGrade) studentFilter.classGrade = classGrade;
      if (assignment.section) studentFilter.section = assignment.section;

      const students = await Student.find(studentFilter).select('userId').lean();
      const studentUserIds = students.map((s) => String(s.userId)).filter(Boolean);

      const recipientUserIds = [...new Set([...parentUserIds, ...studentUserIds])];
      if (!recipientUserIds.length) return;

      const subject = course?.subject || 'Homework';
      await notificationService.sendToUsers(recipientUserIds, {
        type: 'homework',
        notification: {
          title: `New ${subject} Homework`,
          body: assignment.title || 'New homework has been assigned.',
        },
        data: {
          type: 'homework_published',
          route: HOMEWORK_PARENT_ROUTE,
          entityId: String(assignment._id),
          schoolId: String(schoolId),
        },
      });
    });
  },

  notifyHomeworkSubmitted(assignment, submission, student) {
    notifySafe(async () => {
      // Course-level teachers are not tracked per assignment, so the teacher who set
      // the work is the one who wants to know it came in.
      const teacherUserId = assignment.assignedByUserId;
      if (!teacherUserId) return;

      const name = student?.name || 'A student';
      await notificationService.sendToUser(teacherUserId, {
        type: 'homework',
        notification: {
          title: submission.isLate ? 'Late homework submitted' : 'Homework submitted',
          body: `${name} submitted "${assignment.title}".`,
        },
        data: {
          type: 'homework_submitted',
          route: '/school/teacher/check-homework',
          entityId: String(submission._id),
          assignmentId: String(assignment._id),
        },
      });
    });
  },

  notifyHomeworkGraded(assignment, submission) {
    notifySafe(async () => {
      const parentUserIds = await parentUserIdsForStudents([submission.studentId]);
      if (!parentUserIds.length) return;

      const grade = submission.letterGrade || `${submission.score}/${assignment.maxScore ?? 100}`;
      await notificationService.sendToUsers(parentUserIds, {
        type: 'homework',
        notification: {
          title: 'Homework checked',
          body: `"${assignment.title}" has been graded: ${grade}.`,
        },
        data: {
          type: 'homework_graded',
          route: HOMEWORK_PARENT_ROUTE,
          entityId: String(submission._id),
          assignmentId: String(assignment._id),
        },
      });
    });
  },

  notifyHomeworkReturned(assignment, submission) {
    notifySafe(async () => {
      const parentUserIds = await parentUserIdsForStudents([submission.studentId]);
      if (!parentUserIds.length) return;

      await notificationService.sendToUsers(parentUserIds, {
        type: 'homework',
        notification: {
          title: 'Homework needs revision',
          body: `"${assignment.title}" was sent back by the teacher. Please review and submit again.`,
        },
        data: {
          type: 'homework_returned',
          route: HOMEWORK_PARENT_ROUTE,
          entityId: String(submission._id),
          assignmentId: String(assignment._id),
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

  /** A quotation request goes live for one or more vendors — first publish, or new vendors added later. */
  notifyRfqPublished(rfq, vendorIds = []) {
    notifySafe(async () => {
      if (!vendorIds.length) return;
      const vendorUserIds = await getVendorUserIds(vendorIds);
      if (!vendorUserIds.length) return;

      await notificationService.sendToUsers(vendorUserIds, {
        type: 'rfq_update',
        notification: {
          title: 'New Quotation Request',
          body: `${rfq.title} — a school has invited you to submit a quote.`,
        },
        data: {
          type: 'rfq_invited',
          route: '/vendor/quotations',
          entityId: String(rfq._id),
          rfqNumber: rfq.rfqNumber,
        },
      });
    });
  },

  /** A vendor submitted (priced) a quote — let the school know a response is waiting. */
  notifyQuoteSubmitted(schoolId, rfq, vendorName) {
    notifySafe(async () => {
      const schoolUserIds = await getSchoolStaffUserIds(schoolId);
      if (!schoolUserIds.length) return;

      await notificationService.sendToUsers(schoolUserIds, {
        type: 'rfq_update',
        notification: {
          title: 'New Quote Received',
          body: `${vendorName || 'A vendor'} submitted a quote for "${rfq.title}".`,
        },
        data: {
          type: 'rfq_quote_submitted',
          route: '/school/quotations',
          entityId: String(rfq._id),
          rfqNumber: rfq.rfqNumber,
        },
      });
    });
  },

  /** The school awarded the contract to a vendor's quote. */
  notifyQuoteAwarded(rfq, winningVendorId) {
    notifySafe(async () => {
      const vendorUserIds = await getVendorUserIds([winningVendorId]);
      if (!vendorUserIds.length) return;

      await notificationService.sendToUsers(vendorUserIds, {
        type: 'rfq_update',
        notification: {
          title: 'Contract Awarded 🎉',
          body: `You've been awarded the contract for "${rfq.title}".`,
        },
        data: {
          type: 'rfq_awarded',
          route: '/vendor/quotations',
          entityId: String(rfq._id),
          rfqNumber: rfq.rfqNumber,
        },
      });
    });
  },

  /** Every other vendor who quoted lost this RFQ once one of them was awarded. */
  notifyQuoteRejected(rfq, rejectedVendorIds = []) {
    notifySafe(async () => {
      if (!rejectedVendorIds.length) return;
      const vendorUserIds = await getVendorUserIds(rejectedVendorIds);
      if (!vendorUserIds.length) return;

      await notificationService.sendToUsers(vendorUserIds, {
        type: 'rfq_update',
        notification: {
          title: 'Quotation Not Selected',
          body: `Your quote for "${rfq.title}" was not selected this time.`,
        },
        data: {
          type: 'rfq_rejected',
          route: '/vendor/quotations',
          entityId: String(rfq._id),
          rfqNumber: rfq.rfqNumber,
        },
      });
    });
  },

  /** The school cancelled a live RFQ — every invited vendor stops seeing it as
   *  something to act on, so anyone mid-quote needs to be told why it vanished. */
  notifyRfqCancelled(rfq, vendorIds = []) {
    notifySafe(async () => {
      if (!vendorIds.length) return;
      const vendorUserIds = await getVendorUserIds(vendorIds);
      if (!vendorUserIds.length) return;

      await notificationService.sendToUsers(vendorUserIds, {
        type: 'rfq_update',
        notification: {
          title: 'Quotation Request Cancelled',
          body: `"${rfq.title}" was cancelled by the school and is no longer accepting quotes.`,
        },
        data: {
          type: 'rfq_cancelled',
          route: '/vendor/quotations',
          entityId: String(rfq._id),
          rfqNumber: rfq.rfqNumber,
        },
      });
    });
  },

  /** The school captured the RFQ advance — the awarded vendor can start work. */
  notifyRfqAdvancePaid(order) {
    notifySafe(async () => {
      const vendorIds = order.vendorIds || [];
      if (!vendorIds.length) return;
      const vendorUserIds = await getVendorUserIds(vendorIds);
      if (!vendorUserIds.length) return;

      await notificationService.sendToUsers(vendorUserIds, {
        type: 'order_update',
        notification: {
          title: 'Advance Payment Received',
          body: `The advance for order #${order.orderNumber} has been paid. You can start fulfilling it.`,
        },
        data: {
          type: 'rfq_advance_paid',
          route: vendorOrderRoute(order._id),
          entityId: String(order._id),
        },
      });
    });
  },

  /** The school paid off the remaining balance on an RFQ order — it's now fully settled. */
  notifyRfqRemainderPaid(order) {
    notifySafe(async () => {
      const vendorIds = order.vendorIds || [];
      if (!vendorIds.length) return;
      const vendorUserIds = await getVendorUserIds(vendorIds);
      if (!vendorUserIds.length) return;

      await notificationService.sendToUsers(vendorUserIds, {
        type: 'order_update',
        notification: {
          title: 'Order Fully Paid',
          body: `The remaining balance for order #${order.orderNumber} has been paid — it's now fully settled.`,
        },
        data: {
          type: 'rfq_remainder_paid',
          route: vendorOrderRoute(order._id),
          entityId: String(order._id),
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

  notifyAttendanceMarked(schoolId, attendanceRecords, studentsById, dateStr) {
    notifySafe(async () => {
      if (!attendanceRecords?.length || !studentsById) return;

      const dateFormatted = dateStr ? new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }) : 'Today';

      for (const record of attendanceRecords) {
        const student = studentsById.get(String(record.studentId));
        if (!student) continue;

        const parentUserIds = await parentUserIdsForStudents([record.studentId]);
        const recipientUserIds = [...new Set([...parentUserIds, ...(student.userId ? [String(student.userId)] : [])])];
        if (!recipientUserIds.length) continue;

        const studentName = student.name || 'Student';
        const statusRaw = (record.status || 'marked').toLowerCase();
        const statusUpper = statusRaw.toUpperCase();

        let title = `Attendance Alert: ${statusUpper}`;
        let body = `${studentName} has been marked ${statusUpper} for ${dateFormatted}.`;

        if (statusRaw === 'absent') {
          title = `⚠️ Attendance Alert: ABSENT`;
          body = `${studentName} has been marked ABSENT for ${dateFormatted}.`;
        } else if (statusRaw === 'present') {
          title = `✅ Attendance Update: PRESENT`;
          body = `${studentName} has been marked PRESENT for ${dateFormatted}.`;
        } else if (statusRaw === 'late') {
          title = `⏰ Attendance Alert: LATE`;
          body = `${studentName} has been marked LATE for ${dateFormatted}.`;
        }

        await notificationService.sendToUsers(recipientUserIds, {
          type: 'attendance',
          notification: {
            title,
            body,
          },
          data: {
            type: 'attendance_marked',
            status: statusRaw,
            studentId: String(record.studentId),
            schoolId: String(schoolId),
            route: '/school/parent/attendance',
          },
        });
      }
    });
  },
};

module.exports = triggerService;
