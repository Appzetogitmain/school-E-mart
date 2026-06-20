const PasswordReset = require('../../../database/models/PasswordReset');

const passwordResetRepository = {
  create(data) {
    return PasswordReset.create(data);
  },

  findActiveByTokenHash(tokenHash) {
    return PasswordReset.findOne({
      tokenHash,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean();
  },

  markConsumed(id) {
    return PasswordReset.findByIdAndUpdate(
      id,
      { $set: { consumedAt: new Date() } },
      { new: true }
    ).lean();
  },

  invalidateActiveForUser(userId) {
    return PasswordReset.updateMany(
      { userId, consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );
  },
};

module.exports = passwordResetRepository;
