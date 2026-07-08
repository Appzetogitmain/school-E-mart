const AdminProfile = require('../../../database/models/AdminProfile');
const User = require('../../../database/models/User');

const adminProfileService = {
  async getProfile(userId) {
    const [profile, user] = await Promise.all([
      AdminProfile.findOne({ userId }).lean(),
      User.findById(userId).select('name email phone role').lean(),
    ]);

    return {
      userId: String(userId),
      firstName: profile?.firstName || (user?.name || '').split(' ')[0] || '',
      lastName: profile?.lastName || (user?.name || '').split(' ').slice(1).join(' ') || '',
      mobile: profile?.mobile || user?.phone || '',
      email: user?.email || '',
      scopes: profile?.scopes || ['*'],
    };
  },

  async updateProfile(userId, data) {
    const { firstName, lastName, mobile } = data;

    const profile = await AdminProfile.findOneAndUpdate(
      { userId },
      { $set: { userId, firstName, lastName, mobile } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    // Keep the User display name in sync with the profile.
    await User.findByIdAndUpdate(userId, {
      $set: { name: `${firstName} ${lastName}`.trim() },
    });

    return this.getProfile(userId);
  },
};

module.exports = adminProfileService;
