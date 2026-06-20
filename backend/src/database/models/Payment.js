const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amountPaise: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true, default: 'INR' },
  method: {
    type: String,
    enum: ['upi', 'card', 'netbanking', 'wallet', 'cod'],
    required: true
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'payu', 'internal']
  },
  gatewayOrderId: { type: String },
  gatewayPaymentId: { type: String },
  gatewaySignature: { type: String },
  status: {
    type: String,
    enum: ['initiated', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'],
    required: true,
    default: 'initiated'
  },
  failureReason: { type: String },
  refunds: [{
    refundId: { type: String },
    amountPaise: { type: Number, min: 0 },
    at: { type: Date, default: Date.now },
    reason: { type: String },
    status: { type: String }
  }],
  idempotencyKey: { type: String, required: true, unique: true }
}, { collection: 'payments', timestamps: false });

// Plugins
paymentSchema.plugin(auditPlugin);

// Indexes
paymentSchema.index({ orderId: 1 });
// idempotencyKey is already unique
paymentSchema.index({ gatewayPaymentId: 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1, 'audit.createdAt': -1 });

module.exports = mongoose.model('Payment', paymentSchema);
