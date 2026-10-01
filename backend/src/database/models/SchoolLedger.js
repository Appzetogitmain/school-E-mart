const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

// Tracks what a school earns from kit sales. Mirrors VendorLedger so the school
// side has the same running-balance and payout story the vendor side does.
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
const schoolLedgerSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  transactionType: {
    type: String,
    enum: ['kit_commission_credit', 'retail_commission_credit', 'payout_debit', 'adjustment', 'refund_debit'],
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
}, { collection: 'schoolLedgers', timestamps: false });

schoolLedgerSchema.plugin(auditPlugin);

schoolLedgerSchema.index({ schoolId: 1, 'audit.createdAt': -1 });
schoolLedgerSchema.index({ 'reference.kind': 1, 'reference.id': 1 });

module.exports = mongoose.model('SchoolLedger', schoolLedgerSchema);
