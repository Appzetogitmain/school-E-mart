const Referral = require('../../../database/models/Referral');
const ReferralInvitee = require('../../../database/models/ReferralInvitee');
const Order = require('../../../database/models/Order');
const ParentProfile = require('../../../database/models/ParentProfile');
const walletService = require('./wallet.service');
const logger = require('../../../common/logger');

const DEFAULT_REWARDS = {
  referrerBonusPaise: 5000,
  inviteeBonusPaise: 5000,
  minOrderValuePaise: 49900,
};

/**
 * Resolve a referral program record from a shared code. Codes can come from the
 * Referral collection (minted on the Refer & Earn page) or straight from the
 * ParentProfile (assigned at registration) — in the latter case we lazily
 * create the Referral record for the owner.
 */
const resolveReferralByCode = async (code) => {
  const normalized = code.trim().toUpperCase();

  let referral = await Referral.findOne({ referralCode: normalized, status: 'active' }).lean();
  if (referral) return referral;

  const profile = await ParentProfile.findOne({ referralCode: normalized }).lean();
  if (!profile) return null;

  const created = await Referral.create({
    referrerUserId: profile.userId,
    referralCode: normalized,
    programName: 'parent_invite',
    rewardConfig: DEFAULT_REWARDS,
    status: 'active',
  });
  return created.toObject();
};

/**
 * Referral lifecycle hooks.
 * - linkInviteeOnRegistration: called after a parent registers with a referral code.
 * - processOrderDelivered: called when an order is delivered; issues the one-time
 *   referral bonus to both sides once the invitee's first qualifying order lands.
 * Both are fire-and-forget safe: failures are logged, never thrown into the caller.
 */
const referralRewardService = {
  async linkInviteeOnRegistration({ referralCode, userId, phone }) {
    try {
      if (!referralCode) return null;

      const referral = await resolveReferralByCode(referralCode);
      if (!referral) return null;

      // Self-referral guard
      if (String(referral.referrerUserId) === String(userId)) return null;

      const existing = await ReferralInvitee.findOne({
        referralId: referral._id,
        $or: [{ inviteeUserId: userId }, ...(phone ? [{ inviteePhone: phone }] : [])],
      });

      if (existing) {
        if (existing.status === 'invited') {
          existing.inviteeUserId = userId;
          if (phone) existing.inviteePhone = phone;
          existing.status = 'registered';
          await existing.save();
        }
        return existing.toObject ? existing.toObject() : existing;
      }

      const invitee = await ReferralInvitee.create({
        referralId: referral._id,
        inviteePhone: phone || 'unknown',
        inviteeUserId: userId,
        status: 'registered',
      });
      return invitee.toObject();
    } catch (error) {
      logger.warn('Referral registration link failed', { message: error.message });
      return null;
    }
  },

  async processOrderDelivered(order) {
    try {
      if (!order?.userId) return null;

      // Only reward for the invitee's FIRST delivered order.
      const invitee = await ReferralInvitee.findOne({
        inviteeUserId: order.userId,
        status: 'registered',
      });
      if (!invitee) return null;

      const referral = await Referral.findById(invitee.referralId).lean();
      if (!referral || referral.status !== 'active') return null;

      const orderTotal = order.totalPaise ?? order.subtotalPaise ?? 0;
      const minOrder = referral.rewardConfig?.minOrderValuePaise || 0;
      if (orderTotal < minOrder) return null;

      const deliveredCount = await Order.countDocuments({
        userId: order.userId,
        orderStatus: 'delivered',
      });
      if (deliveredCount > 1) {
        // Not the first delivered order — close the invite without reward.
        invitee.status = 'reward_issued';
        await invitee.save();
        return null;
      }

      const referrerBonus = referral.rewardConfig?.referrerBonusPaise || 0;
      const inviteeBonus = referral.rewardConfig?.inviteeBonusPaise || 0;

      let referrerTxn = null;
      if (referrerBonus > 0) {
        referrerTxn = await walletService.postTransaction(referral.referrerUserId, {
          type: 'credit',
          category: 'referral',
          amountPaise: referrerBonus,
          reference: { kind: 'ReferralInvitee', id: invitee._id },
          description: 'Referral bonus — your invite placed their first order',
        });
      }
      if (inviteeBonus > 0) {
        await walletService.postTransaction(order.userId, {
          type: 'credit',
          category: 'referral',
          amountPaise: inviteeBonus,
          reference: { kind: 'ReferralInvitee', id: invitee._id },
          description: 'Welcome bonus — first order completed',
        });
      }

      invitee.status = 'reward_issued';
      if (referrerTxn) invitee.rewardWalletTxnId = referrerTxn._id;
      await invitee.save();

      logger.info('Referral reward issued', {
        inviteeUserId: String(order.userId),
        referrerUserId: String(referral.referrerUserId),
        orderId: String(order._id),
      });
      return invitee.toObject();
    } catch (error) {
      logger.warn('Referral reward processing failed', {
        orderId: String(order?._id),
        message: error.message,
      });
      return null;
    }
  },
};

module.exports = referralRewardService;
