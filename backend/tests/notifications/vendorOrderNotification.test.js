const mongoose = require('mongoose');
const User = require('../../src/database/models/User');
const VendorProfile = require('../../src/database/models/VendorProfile');
const Notification = require('../../src/database/models/Notification');
const { triggerService, notificationService } = require('../../src/services/notification');
const { generateUserRefId } = require('../../src/modules/school/utils/refId');

describe('Vendor Order Notifications', () => {
  let buyerUser;
  let vendorUser;
  let vendorProfile;

  beforeEach(async () => {
    // 1. Create Buyer User
    buyerUser = await User.create({
      refId: generateUserRefId('P'),
      role: 'parent',
      status: 'active',
      name: 'Rohan Parent',
      phone: `98${Math.floor(10000000 + Math.random() * 9000000)}`,
      email: `buyer${Date.now()}@test.com`,
    });

    // 2. Create Vendor User
    vendorUser = await User.create({
      refId: generateUserRefId('VEN'),
      role: 'vendor',
      status: 'active',
      name: 'Arun Vendor',
      phone: `94${Math.floor(10000000 + Math.random() * 9000000)}`,
      email: `vendor${Date.now()}@test.com`,
    });

    // 3. Create VendorProfile
    vendorProfile = await VendorProfile.create({
      userId: vendorUser._id,
      storeName: 'Arun Stationery Store',
      storeSlug: `arun-store-${Date.now()}`,
      commissionPercent: 10,
      approvalStatus: 'approved',
      address: {
        line1: '123 Market Street',
        city: 'Indore',
        state: 'MP',
        country: 'India',
        pinCode: '452001',
      },
      location: {
        type: 'Point',
        coordinates: [75.8577, 22.7196],
      },
      serviceRadiusKm: 15,
    });
  });

  afterEach(async () => {
    if (vendorUser?._id && buyerUser?._id) {
      await Notification.deleteMany({ userId: { $in: [vendorUser._id, buyerUser._id] } });
      await VendorProfile.deleteMany({ _id: vendorProfile._id });
      await User.deleteMany({ _id: { $in: [vendorUser._id, buyerUser._id] } });
    }
  });

  const waitForNotification = async (userId, timeoutMs = 2000) => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const notifs = await Notification.find({ userId }).lean();
      if (notifs.length > 0) return notifs;
      await new Promise((r) => setTimeout(r, 100));
    }
    return Notification.find({ userId }).lean();
  };

  it('should create an in-app and push notification for vendor when order is placed', async () => {
    const fakeOrderId = new mongoose.Types.ObjectId();
    const fakeOrder = {
      _id: fakeOrderId,
      orderNumber: `ORD-TEST-${Date.now()}`,
      userId: buyerUser._id,
      vendorIds: [vendorProfile._id],
      items: [
        {
          vendorId: vendorProfile._id,
          name: 'School Backpack',
          quantity: 1,
          lineTotalPaise: 150000,
        },
      ],
      totalPaise: 150000,
      address: {
        name: 'Rohan Parent',
        phone: '9876543210',
      },
    };

    // Trigger notification
    triggerService.notifyOrderPlaced(fakeOrder);

    // Wait for notification record
    const vendorNotifications = await waitForNotification(vendorUser._id);
    expect(vendorNotifications.length).toBeGreaterThanOrEqual(1);

    const vendorNotif = vendorNotifications[0];
    expect(vendorNotif.title).toContain('New Order Received');
    expect(vendorNotif.body).toContain(fakeOrder.orderNumber);
    expect(vendorNotif.body).toContain('Rohan Parent');
    expect(vendorNotif.type).toBe('order_update');
    expect(vendorNotif.actionUrl).toBe(`/vendor/orders/${fakeOrderId}`);

    // Verify notificationService.listForUser retrieves it
    const listResult = await notificationService.listForUser(vendorUser._id);
    expect(listResult.items.length).toBe(1);
    expect(listResult.items[0].title).toContain('New Order Received');
  });

  it('should find vendor from order.items if order.vendorIds is empty', async () => {
    const fakeOrderId = new mongoose.Types.ObjectId();
    const fakeOrder = {
      _id: fakeOrderId,
      orderNumber: `ORD-TEST-${Date.now()}`,
      userId: buyerUser._id,
      vendorIds: [], // Empty vendorIds array
      items: [
        {
          vendorId: vendorProfile._id,
          name: 'School Notebooks',
          quantity: 2,
          lineTotalPaise: 50000,
        },
      ],
      totalPaise: 50000,
      address: {
        name: 'Priya Mother',
        phone: '9876543210',
      },
    };

    triggerService.notifyOrderPlaced(fakeOrder);

    const vendorNotifications = await waitForNotification(vendorUser._id);
    expect(vendorNotifications.length).toBeGreaterThanOrEqual(1);
    expect(vendorNotifications[0].title).toContain('New Order Received');
    expect(vendorNotifications[0].body).toContain(fakeOrder.orderNumber);
    expect(vendorNotifications[0].body).toContain('Priya Mother');
  });
});
