const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const supportMessageSchema = new mongoose.Schema({
  ticketId: { type: String, required: true }, // Grouping ID for conversation
  senderUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  topicId: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTopic', required: true },
  subject: { type: String },
  body: { type: String, required: true },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  reference: {
    kind: { type: String }, // 'Order', 'Product', 'VendorProfile'
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  status: {
    type: String,
    enum: ['open', 'pending_customer', 'pending_internal', 'resolved', 'closed'],
    required: true,
    default: 'open'
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // The SupportAccountManager or agent
  isReadByCustomer: { type: Boolean, default: false }
}, { collection: 'supportMessages' });

// Plugins
supportMessageSchema.plugin(auditPlugin);
supportMessageSchema.plugin(softDeletePlugin);

// Indexes
supportMessageSchema.index({ ticketId: 1, 'audit.createdAt': 1 });
supportMessageSchema.index({ senderUserId: 1, status: 1, 'audit.updatedAt': -1 });
supportMessageSchema.index({ assignedTo: 1, status: 1 });
// Soft delete compound index
supportMessageSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
