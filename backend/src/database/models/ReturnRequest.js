const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const returnRequestSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderItemIndex: { type: Number, required: true, min: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', required: true },
  productSnapshot: {
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String },
    pricePaise: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  },
  reason: { type: String, required: true },
  description: { type: String },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  status: {
    type: String,
    enum: ['requested', 'approved', 'qc_passed', 'pickup_assigned', 'in_transit', 'rejected', 'completed'],
    required: true,
    default: 'requested'
  },
  qcStatus: {
    type: String,
    enum: ['pending', 'passed', 'failed']
  },
  refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' }, // Reference to a refund
  timeline: [{
    status: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
    note: { type: String },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }]
}, { collection: 'returnRequests', timestamps: false });

// Plugins
returnRequestSchema.plugin(auditPlugin);
returnRequestSchema.plugin(softDeletePlugin);

// Indexes
returnRequestSchema.index({ vendorId: 1, status: 1, 'audit.createdAt': -1 });
returnRequestSchema.index({ userId: 1, 'audit.createdAt': -1 });
returnRequestSchema.index({ orderId: 1 });
// Soft delete compound index
returnRequestSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
