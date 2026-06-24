const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, default: 'razorpay' },
    eventId: { type: String, required: true },
    eventType: { type: String },
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed', 'skipped'],
      required: true,
      default: 'processing',
    },
    payload: { type: mongoose.Schema.Types.Mixed },
    error: { type: String },
  },
  { collection: 'webhook_events', timestamps: false }
);

webhookEventSchema.plugin(auditPlugin);
webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true });
webhookEventSchema.index({ status: 1, 'audit.createdAt': -1 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
