const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const walletTransactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: 'Wallet', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['credit', 'debit'],
    required: true
  },
  category: {
    type: String,
    enum: ['order_payment', 'order_refund', 'payout', 'commission', 'referral', 'adjustment'],
    required: true
  },
  amountPaise: { type: Number, required: true, min: 1 },
  runningBalancePaise: { type: Number, required: true, min: 0 }, // Snapshot after txn
  reference: {
    kind: { type: String }, // 'Order', 'PayoutRequest', etc.
    id: { type: mongoose.Schema.Types.ObjectId }
  },
  description: { type: String, required: true },
  status: {
    type: String,
    enum: ['posted', 'pending', 'reversed'],
    required: true,
    default: 'posted'
  }
}, { collection: 'walletTransactions', timestamps: false });

// Plugins
walletTransactionSchema.plugin(auditPlugin);

// Indexes
walletTransactionSchema.index({ walletId: 1, 'audit.createdAt': -1 });
walletTransactionSchema.index({ userId: 1, category: 1, 'audit.createdAt': -1 });
walletTransactionSchema.index({ 'reference.kind': 1, 'reference.id': 1 });

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
