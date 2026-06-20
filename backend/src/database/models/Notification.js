const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  type: {
    type: String,
    enum: ['system', 'order_update', 'promo', 'school_notice', 'event', 'rfq_update'],
    required: true
  },
  channel: {
    type: String,
    enum: ['push', 'in_app', 'email', 'sms'],
    required: true
  },
  actionUrl: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'NotificationCampaign' },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    required: true,
    default: 'pending'
  },
  isRead: { type: Boolean, required: true, default: false },
  sentAt: { type: Date },
  readAt: { type: Date },
  createdAt: { type: Date, required: true, default: Date.now }
}, { collection: 'notifications', timestamps: false });

// Indexes
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ campaignId: 1, status: 1 });
notificationSchema.index({ createdAt: -1 }); // TTL could be added if requested, e.g. delete after 30 days.

module.exports = mongoose.model('Notification', notificationSchema);
