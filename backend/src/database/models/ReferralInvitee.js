const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const referralInviteeSchema = new mongoose.Schema({
  referralId: { type: mongoose.Schema.Types.ObjectId, ref: 'Referral', required: true },
  inviteePhone: { type: String, required: true },
  inviteeUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['invited', 'registered', 'reward_issued'],
    required: true,
    default: 'invited'
  },
  rewardWalletTxnId: { type: mongoose.Schema.Types.ObjectId, ref: 'WalletTransaction' }
}, { collection: 'referralInvitees' });

// Plugins
referralInviteeSchema.plugin(auditPlugin);

// Indexes
referralInviteeSchema.index({ referralId: 1, status: 1 });
referralInviteeSchema.index({ inviteePhone: 1 }, { unique: true });

module.exports = mongoose.model('ReferralInvitee', referralInviteeSchema);
