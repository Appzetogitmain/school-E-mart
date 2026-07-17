const mongoose = require('mongoose');
const User = require('../../src/database/models/User');
const Notification = require('../../src/database/models/Notification');
const NotificationCampaign = require('../../src/database/models/NotificationCampaign');
const tokenService = require('../../src/services/notification/token.service');
const adminNotificationCampaignService = require('../../src/modules/admin/services/notificationCampaign.service');

describe('Notification Campaign Flow', () => {
  let parentUser;
  let vendorUser;
  let adminUserId;

  beforeEach(async () => {
    adminUserId = new mongoose.Types.ObjectId();

    // Create a parent user
    parentUser = await User.create({
      refId: 'SEM-P-1234',
      role: 'parent',
      status: 'active',
      name: 'John Parent',
      phone: '9876543210',
      email: 'parent@example.com',
    });

    // Create a vendor user
    vendorUser = await User.create({
      refId: 'SEM-VEN-1234',
      role: 'vendor',
      status: 'active',
      name: 'Apple Vendor',
      phone: '9876543211',
      email: 'vendor@example.com',
    });

    // Register active tokens
    await tokenService.registerToken({
      userId: parentUser._id,
      token: 'parent-fcm-token',
      platform: 'web',
    });

    await tokenService.registerToken({
      userId: vendorUser._id,
      token: 'vendor-fcm-token',
      platform: 'web',
    });
  });

  test('successfully sends campaign to parent audience and creates notifications with campaign type', async () => {
    const campaign = await adminNotificationCampaignService.createCampaign({
      title: 'Alert for Parents',
      messageBody: 'Your child has a school holiday tomorrow.',
      targetAudience: 'all_parents',
    }, adminUserId);

    expect(campaign.status).toBe('completed');
    expect(campaign.metrics.totalTargeted).toBe(1);

    // Check if the Notification record was created in MongoDB
    const notifications = await Notification.find({ userId: parentUser._id }).lean();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].title).toBe('Alert for Parents');
    expect(notifications[0].body).toBe('Your child has a school holiday tomorrow.');
    expect(notifications[0].type).toBe('campaign');
    expect(String(notifications[0].campaignId)).toBe(String(campaign._id));

    // Vendor should not get this notification
    const vendorNotifications = await Notification.find({ userId: vendorUser._id }).lean();
    expect(vendorNotifications).toHaveLength(0);
  });

  test('successfully sends campaign to vendor audience', async () => {
    const campaign = await adminNotificationCampaignService.createCampaign({
      title: 'Vendor Payouts',
      messageBody: 'Vendor payments have been processed.',
      targetAudience: 'all_vendors',
    }, adminUserId);

    expect(campaign.status).toBe('completed');
    expect(campaign.metrics.totalTargeted).toBe(1);

    const notifications = await Notification.find({ userId: vendorUser._id }).lean();
    expect(notifications).toHaveLength(1);
    expect(notifications[0].type).toBe('campaign');
    expect(notifications[0].title).toBe('Vendor Payouts');

    const parentNotifications = await Notification.find({ userId: parentUser._id }).lean();
    expect(parentNotifications).toHaveLength(0);
  });
});
