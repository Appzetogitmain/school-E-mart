const User = require('../../../database/models/User');

const activeUserFilter = {
  'softDelete.isDeleted': { $ne: true },
};

const userRepository = {
  findByEmail(email) {
    return User.findOne({ email, ...activeUserFilter }).lean();
  },

  findByPhone(phone) {
    return User.findOne({ phone, ...activeUserFilter }).lean();
  },

  findByPhoneAndRole(phone, role) {
    return User.findOne({ phone, role, ...activeUserFilter }).lean();
  },

  findById(id) {
    return User.findOne({ _id: id, ...activeUserFilter }).lean();
  },

  findActiveById(id) {
    return User.findOne({
      _id: id,
      status: { $in: ['active', 'pending_approval'] },
      ...activeUserFilter,
    }).lean();
  },

  findByEmailAndRole(email, role) {
    return User.findOne({ email, role, ...activeUserFilter }).lean();
  },

  updateLoginSuccess(userId) {
    return User.findByIdAndUpdate(
      userId,
      {
        $set: { lastLoginAt: new Date() },
        $inc: { loginCount: 1 },
      },
      { new: true }
    ).lean();
  },

  updatePassword(userId, passwordHash, passwordAlgo = 'bcrypt') {
    return User.findByIdAndUpdate(
      userId,
      { $set: { passwordHash, passwordAlgo } },
      { new: true }
    ).lean();
  },

  markEmailVerified(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { emailVerifiedAt: new Date() } },
      { new: true }
    ).lean();
  },

  markPhoneVerified(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { phoneVerifiedAt: new Date() } },
      { new: true }
    ).lean();
  },

  suspendUser(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { status: 'suspended' } },
      { new: true }
    ).lean();
  },
};

module.exports = userRepository;
