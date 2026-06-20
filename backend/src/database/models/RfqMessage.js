const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const rfqMessageSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rfq', required: true },
  senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Optional: if null, broadcast to all participants
  message: { type: String, required: true },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, { collection: 'rfqMessages', timestamps: false });

// Plugins
rfqMessageSchema.plugin(auditPlugin);

// Indexes
rfqMessageSchema.index({ rfqId: 1, 'audit.createdAt': 1 });
rfqMessageSchema.index({ recipientUserId: 1, isRead: 1 });

module.exports = mongoose.model('RfqMessage', rfqMessageSchema);
