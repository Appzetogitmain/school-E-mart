const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

// Tracks what a school earns from kit sales. Mirrors VendorLedger so the school
// side has the same running-balance and payout story the vendor side does.
const schoolLedgerSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  transactionType: {
    type: String,
    enum: ['kit_commission_credit', 'retail_commission_credit', 'payout_debit', 'adjustment', 'refund_debit'],
    required: true
  },
  amountPaise: { type: Number, required: true },
  balancePaise: { type: Number, required: true }, // running balance after this transaction
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
