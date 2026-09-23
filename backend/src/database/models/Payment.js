const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

/**
 * One refund attempt against a payment.
 *
 * `status` deliberately mirrors Razorpay's own refund lifecycle rather than an
 * internal approval state. A refund that we have asked the gateway for is
 * 'pending' until the gateway says otherwise — it is NOT 'completed' just
 * because the API call returned. Marking refunds complete on creation is what
 * made the admin panel claim money was returned that Razorpay was still
 * holding (or had failed to return at all).
 */
const refundSchema = new mongoose.Schema(
  {
    refundId: { type: String },
    amountPaise: { type: Number, min: 0 },
    at: { type: Date, default: Date.now },
    reason: { type: String },
    status: {
      type: String,
      // pending/processed/failed are Razorpay's; 'requested' is ours, for a
      // refund an admin has asked for but which has not reached the gateway yet.
      // 'initiated' is retained only because refunds already written to
      // production carry it; it means the same as 'pending' and must stay valid
      // so existing documents can be updated without a data migration.
      enum: ['requested', 'initiated', 'pending', 'processed', 'failed', 'rejected'],
      default: 'pending',
    },
    // Whether the money actually left the gateway. Only `refund.processed`
    // (or a direct fetch showing status=processed) may set this.
    settledAt: { type: Date },
    failureReason: { type: String },
    // Audit trail. These used to be written by the service but were absent from
    // the schema, so Mongoose's strict mode dropped them silently and the admin
    // refund history was always blank.
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
    // Set when the refund was recorded from a gateway webhook/sync rather than
    // initiated here, so operations can tell apart "we refunded" from
    // "someone refunded this in the Razorpay dashboard".
    source: { type: String, enum: ['admin', 'webhook', 'sync'], default: 'admin' },
  },
  { _id: true }
);

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
  refunds: [refundSchema],
  idempotencyKey: { type: String, required: true, unique: true },

  // ---------------------------------------------------------------------------
  // Reconciliation with the gateway.
  //
  // The gateway, not this database, is the authority on what money actually
  // moved. These fields record what it last told us and whether that agrees
  // with our own books, so a disagreement becomes a visible, queryable fact
  // instead of something a client discovers by comparing two dashboards.
  // ---------------------------------------------------------------------------

  // Raw status string as the gateway last reported it (e.g. Razorpay's
  // created/authorized/captured/refunded/failed). Kept verbatim so the admin
  // panel can show exactly what the Razorpay dashboard shows.
  gatewayStatus: { type: String },
  // What the gateway says it captured / refunded, in paise. May differ from
  // amountPaise on a short or partial capture.
  amountCapturedPaise: { type: Number, min: 0 },
  amountRefundedPaise: { type: Number, min: 0, default: 0 },
  lastSyncedAt: { type: Date },
  // Set whenever the gateway's view and ours disagree in a way that needs a
  // human: a short capture, money captured against an order we cancelled, a
  // refund the gateway rejected. Cleared when the disagreement is resolved.
  reconciliation: {
    status: {
      type: String,
      enum: ['ok', 'mismatch', 'resolved'],
      default: 'ok',
    },
    // Machine-readable reason, e.g. SHORT_CAPTURE, CAPTURED_ON_CANCELLED_ORDER,
    // PAID_NOT_RECORDED, REFUND_FAILED.
    code: { type: String },
    detail: { type: String },
    detectedAt: { type: Date },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNote: { type: String },
  },
}, { collection: 'payments', timestamps: false });

// Plugins
paymentSchema.plugin(auditPlugin);

// Indexes
paymentSchema.index({ orderId: 1 });
// Backs sumCapturedForOrder and "the captured payment for this order" lookups,
// which previously scanned every payment row for the order.
paymentSchema.index({ orderId: 1, status: 1 });
// idempotencyKey is already unique
paymentSchema.index({ gatewayPaymentId: 1 }, { unique: true, sparse: true });
// The webhook and the reconciler both find payments by the gateway's order id;
// without this every incoming webhook was a collection scan.
paymentSchema.index({ gatewayOrderId: 1 });
paymentSchema.index({ status: 1, 'audit.createdAt': -1 });
// Drives the "needs reconciliation" sweep and the admin mismatch report.
paymentSchema.index({ 'reconciliation.status': 1, 'audit.createdAt': -1 });
// Lets the reconciler pick up the oldest unresolved payments first.
paymentSchema.index({ status: 1, lastSyncedAt: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
