const AuthSession = require('../../../database/models/AuthSession');

const sessionRepository = {
  create(data) {
    return AuthSession.create(data);
  },

  findByJti(jti) {
    return AuthSession.findOne({ jti }).lean();
  },

  findActiveByJti(jti) {
    return AuthSession.findOne({
      jti,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean();
  },

  findActiveByRefreshHash(refreshTokenHash) {
    return AuthSession.findOne({
      refreshTokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).lean();
  },

  findById(id) {
    return AuthSession.findById(id).lean();
  },

  findActiveByUserId(userId) {
    return AuthSession.find({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ lastSeenAt: -1 })
      .lean();
  },

  revokeById(sessionId) {
    return AuthSession.findByIdAndUpdate(
      sessionId,
      { $set: { revokedAt: new Date() } },
      { new: true }
    ).lean();
  },

  revokeByJti(jti) {
    return AuthSession.findOneAndUpdate(
      { jti },
      { $set: { revokedAt: new Date() } },
      { new: true }
    ).lean();
  },

  revokeAllForUser(userId, exceptSessionId = null) {
    const filter = { userId, revokedAt: null };
    if (exceptSessionId) {
      filter._id = { $ne: exceptSessionId };
    }
    return AuthSession.updateMany(filter, { $set: { revokedAt: new Date() } });
  },

  touch(sessionId) {
    return AuthSession.findByIdAndUpdate(
      sessionId,
      { $set: { lastSeenAt: new Date() } },
      { new: true }
    ).lean();
  },
};

module.exports = sessionRepository;
