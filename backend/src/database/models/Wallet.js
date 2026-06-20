const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  currency: { type: String, required: true, default: 'INR' },
  balancePaise: { type: Number, required: true, default: 0, min: 0 },
  onHoldPaise: { type: Number, required: true, default: 0, min: 0 },
  pendingPaise: { type: Number, required: true, default: 0, min: 0 },
  lifetimeCreditPaise: { type: Number, required: true, default: 0, min: 0 },
  lifetimeDebitPaise: { type: Number, required: true, default: 0, min: 0 }
}, { collection: 'wallets', timestamps: false });

// Plugins
walletSchema.plugin(auditPlugin);

// Indexes
// userId is already unique

module.exports = mongoose.model('Wallet', walletSchema);
