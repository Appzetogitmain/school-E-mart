const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const notificationCampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  messageBody: { type: String, required: true },
  imageUrl: { type: String },
  targetAudience: {
    type: String,
    enum: ['all_parents', 'all_vendors', 'all_schools', 'specific_users', 'custom_segment'],
    required: true
  },
  segmentRules: { type: mongoose.Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'processing', 'completed', 'cancelled'],
    required: true,
    default: 'draft'
  },
  scheduledAt: { type: Date },
  metrics: {
    totalTargeted: { type: Number, default: 0 },
    successful: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    readCount: { type: Number, default: 0 }
  }
}, { collection: 'notificationCampaigns' });

// Plugins
notificationCampaignSchema.plugin(auditPlugin);
notificationCampaignSchema.plugin(softDeletePlugin);

// Indexes
notificationCampaignSchema.index({ status: 1, scheduledAt: 1 });
// Soft delete compound index
notificationCampaignSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('NotificationCampaign', notificationCampaignSchema);
