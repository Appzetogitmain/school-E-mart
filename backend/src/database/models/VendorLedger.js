const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const vendorLedgerSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', required: true },
  transactionType: {
    type: String,
    enum: ['order_credit', 'commission_deduction', 'payout_debit', 'adjustment', 'refund_debit'],
    required: true
  },
  amountPaise: { type: Number, required: true },
  balancePaise: { type: Number, required: true }, // running balance after this transaction
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
