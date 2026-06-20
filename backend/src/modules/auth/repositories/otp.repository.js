const OtpRequest = require('../../../database/models/OtpRequest');

const otpRepository = {
  create(data) {
    return OtpRequest.create(data);
  },

  findLatestActive(phone, purpose) {
    return OtpRequest.findOne({
      phone,
      purpose,
      consumedAt: null,
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: -1 })
      .lean();
  },

  incrementAttempts(id) {
    return OtpRequest.findByIdAndUpdate(id, { $inc: { attempts: 1 } }, { new: true }).lean();
  },

  markConsumed(id) {
    return OtpRequest.findByIdAndUpdate(
      id,
      { $set: { consumedAt: new Date() } },
      { new: true }
    ).lean();
  },

  invalidateActiveForPhone(phone, purpose) {
    return OtpRequest.updateMany(
      { phone, purpose, consumedAt: null },
      { $set: { consumedAt: new Date() } }
    );
  },

  countRecentByPhone(phone, since) {
    return OtpRequest.countDocuments({
      phone,
      createdAt: { $gte: since },
    });
  },
};

module.exports = otpRepository;
