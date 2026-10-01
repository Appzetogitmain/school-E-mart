const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

/**
 * `affectsBalance` exists because this ledger mixes two kinds of row.
 *
 * `order_credit` is written already NET of commission, and the matching
 * `commission_deduction` row is a negative-amount record kept purely so the
 * vendor can see what was taken. Its amount must therefore never be summed into
 * the balance — doing so subtracts the commission a second time.
 *
 * In production that made `sum(amountPaise)` disagree with the stored balance by
 * exactly the commission total on every vendor. Marking the informational rows
 * explicitly means a balance can be derived by summing, which is the only way to
 * get one that cannot drift.
 */
const vendorLedgerSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', required: true },
  transactionType: {
    type: String,
    enum: ['order_credit', 'commission_deduction', 'payout_debit', 'adjustment', 'refund_debit'],
    required: true
  },
  amountPaise: { type: Number, required: true },
  // Whether this row's amount moves the balance. See the note above.
  affectsBalance: { type: Boolean, default: true },
  // Running balance after this transaction. Kept for display and history only —
  // never read as the source of truth, because a read-modify-write of the
  // previous row's value drifts permanently the moment two settlements overlap.
  balancePaise: { type: Number, required: true },
  reference: {
    kind: { type: String, required: true }, // 'Order', 'PayoutRequest', etc.
    id: { type: mongoose.Schema.Types.ObjectId, required: true }
  },
  description: { type: String }
}, { collection: 'vendorLedgers', timestamps: false });

// Plugins
vendorLedgerSchema.plugin(auditPlugin);

// Indexes
vendorLedgerSchema.index({ vendorId: 1, 'audit.createdAt': -1 });
vendorLedgerSchema.index({ 'reference.kind': 1, 'reference.id': 1 });

module.exports = mongoose.model('VendorLedger', vendorLedgerSchema);
