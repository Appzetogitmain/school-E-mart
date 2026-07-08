const crypto = require('crypto');
const Referral = require('../../../database/models/Referral');
const ReferralInvitee = require('../../../database/models/ReferralInvitee');
const ParentProfile = require('../../../database/models/ParentProfile');

const DEFAULT_REWARDS = {
  referrerBonusPaise: 5000, // ₹50
  inviteeBonusPaise: 5000,
  minOrderValuePaise: 49900, // ₹499
};

const generateCode = () => `SEM${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

const referralService = {
  /** Resolve (or mint) the user's referral code + program record. */
  async getMyReferral(userId) {
    let referral = await Referral.findOne({ referrerUserId: userId, status: 'active' }).lean();

    if (!referral) {
      // Prefer the code already on the parent profile; mint one otherwise.
      const profile = await ParentProfile.findOne({ userId }).lean();
      let code = profile?.referralCode;
      if (!code) {
        code = generateCode();
        if (profile) {
          await ParentProfile.updateOne({ userId }, { $set: { referralCode: code } });
        }
      }

      const createdDoc = await Referral.create({
        referrerUserId: userId,
        referralCode: code,
        programName: 'parent_invite',
        rewardConfig: DEFAULT_REWARDS,
        status: 'active',
      });
      referral = createdDoc.toObject();
    }

    const invitees = await ReferralInvitee.find({ referralId: referral._id })
      .sort({ 'audit.createdAt': -1 })
      .limit(100)
      .lean();

    const stats = {
      invited: invitees.length,
      registered: invitees.filter((i) => i.status !== 'invited').length,
      rewarded: invitees.filter((i) => i.status === 'reward_issued').length,
      earnedPaise: invitees.filter((i) => i.status === 'reward_issued').length *
        (referral.rewardConfig?.referrerBonusPaise || 0),
    };

    return { referral, invitees, stats };
  },

  async recordInvite(userId, inviteePhone) {
    const { referral } = await this.getMyReferral(userId);
    const existing = await ReferralInvitee.findOne({
      referralId: referral._id,
      inviteePhone,
    }).lean();
    if (existing) return existing;

    const invitee = await ReferralInvitee.create({
      referralId: referral._id,
      inviteePhone,
      status: 'invited',
    });
    return invitee.toObject();
  },
};

module.exports = referralService;
