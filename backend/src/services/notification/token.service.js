const DeviceToken = require('../../database/models/DeviceToken');

const tokenService = {
  async registerToken({ userId, token, platform = 'web', deviceId, userAgent }) {
    const now = new Date();
    const existing = await DeviceToken.findOne({ token }).lean();

    if (existing) {
      return DeviceToken.findOneAndUpdate(
        { token },
        {
          $set: {
            userId,
            platform,
            deviceId: deviceId || existing.deviceId,
            userAgent: userAgent || existing.userAgent,
            isActive: true,
            lastUsedAt: now,
          },
        },
        { new: true }
      ).lean();
    }

    const [record] = await DeviceToken.create([
      {
        userId,
        token,
        platform,
        deviceId,
        userAgent,
        isActive: true,
        lastUsedAt: now,
      },
    ]);
    return record.toObject();
  },

  async unregisterToken({ userId, token, deviceId }) {
    const filter = { userId, isActive: true };
    if (token) filter.token = token;
    if (deviceId) filter.deviceId = deviceId;

    await DeviceToken.updateMany(filter, { $set: { isActive: false } });
    return { removed: true };
  },

  async getActiveTokensForUser(userId) {
    const records = await DeviceToken.find({ userId, isActive: true }).lean();
    return records.map((r) => r.token);
  },

  async getActiveTokensForUsers(userIds) {
    const records = await DeviceToken.find({
      userId: { $in: userIds },
      isActive: true,
    }).lean();
    return records.map((r) => r.token);
  },

  async deactivateToken(token) {
    await DeviceToken.updateOne({ token }, { $set: { isActive: false } });
  },

  async deactivateTokens(tokens) {
    if (!tokens?.length) return;
    await DeviceToken.updateMany({ token: { $in: tokens } }, { $set: { isActive: false } });
  },

  async touchToken(token) {
    await DeviceToken.updateOne({ token, isActive: true }, { $set: { lastUsedAt: new Date() } });
  },

  async touchTokens(tokens) {
    if (!tokens?.length) return;
    await DeviceToken.updateMany(
      { token: { $in: tokens }, isActive: true },
      { $set: { lastUsedAt: new Date() } }
    );
  },
};

module.exports = tokenService;
