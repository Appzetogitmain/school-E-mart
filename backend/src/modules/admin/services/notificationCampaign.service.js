const NotificationCampaign = require('../../../database/models/NotificationCampaign');
const User = require('../../../database/models/User');
const { executePaginatedQuery } = require('../../../repositories');
const { notificationService } = require('../../../services/notification');
const { NotFoundError } = require('../../../common/errors');
const logger = require('../../../common/logger');

const AUDIENCE_ROLES = {
  all_parents: ['parent'],
  all_vendors: ['vendor'],
  all_schools: ['school', 'teacher'],
};

const resolveTargetUserIds = async (targetAudience, segmentRules = {}) => {
  if (targetAudience === 'specific_users') {
    return (segmentRules.userIds || []).map(String);
  }

  const roles =
    targetAudience === 'custom_segment'
      ? segmentRules.roles || []
      : AUDIENCE_ROLES[targetAudience] || [];

  if (!roles.length) return [];

  const users = await User.find({ role: { $in: roles }, status: 'active' })
    .select('_id')
    .lean();
  return users.map((u) => String(u._id));
};

const adminNotificationCampaignService = {
  async listCampaigns(query = {}) {
    const filter = { 'softDelete.isDeleted': { $ne: true } };
    if (query.status) filter.status = query.status;
    return executePaginatedQuery(NotificationCampaign, filter, query, {
      defaultSort: '-audit.createdAt',
    });
  },

  async getCampaign(campaignId) {
    const campaign = await NotificationCampaign.findById(campaignId).lean();
    if (!campaign || campaign.softDelete?.isDeleted) {
      throw new NotFoundError('Campaign not found');
    }
    return campaign;
  },

  /**
   * Create a campaign and (unless scheduled) immediately fan out the push to the
   * resolved audience, persisting in-app records via notificationService.
   */
  async createCampaign(data, actorUserId) {
    const { title, messageBody, imageUrl, targetAudience, segmentRules, scheduledAt, actionUrl } = data;
    const isScheduled = Boolean(scheduledAt) && new Date(scheduledAt) > new Date();

    const campaign = await NotificationCampaign.create({
      title,
      messageBody,
      imageUrl,
      targetAudience,
      segmentRules,
      scheduledAt: scheduledAt || undefined,
      status: isScheduled ? 'scheduled' : 'processing',
    });

    if (isScheduled) {
      return campaign.toObject();
    }

    const userIds = await resolveTargetUserIds(targetAudience, segmentRules || {});
    let successful = 0;
    let failed = 0;

    if (userIds.length) {
      const results = await notificationService.sendToUsers(userIds, {
        notification: { title, body: messageBody, image: imageUrl },
        data: { type: 'campaign', campaignId: String(campaign._id), route: actionUrl || '/notifications' },
        type: 'campaign',
      });
      results.forEach((r) => {
        if (r.status === 'fulfilled' && r.value?.sent) successful += 1;
        else failed += 1;
      });
    }

    campaign.status = 'completed';
    campaign.metrics = {
      totalTargeted: userIds.length,
      successful,
      failed,
      readCount: 0,
    };
    await campaign.save();

    logger.info('Notification campaign sent', {
      campaignId: String(campaign._id),
      targeted: userIds.length,
      successful,
      failed,
      actor: String(actorUserId),
    });

    return campaign.toObject();
  },
};

module.exports = adminNotificationCampaignService;
