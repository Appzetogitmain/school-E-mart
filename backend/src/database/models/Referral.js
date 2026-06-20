const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const referralSchema = new mongoose.Schema({
  referrerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referralCode: { type: String, required: true }, // Duplicate from ParentProfile for faster lookup
  programName: { type: String, required: true, default: 'parent_invite' },
  rewardConfig: {
    referrerBonusPaise: { type: Number, required: true },
    inviteeBonusPaise: { type: Number, required: true },
    minOrderValuePaise: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'referrals' });

// Plugins
referralSchema.plugin(auditPlugin);

// Indexes
referralSchema.index({ referrerUserId: 1 }, { unique: true });
referralSchema.index({ referralCode: 1 }, { unique: true });

module.exports = mongoose.model('Referral', referralSchema);
