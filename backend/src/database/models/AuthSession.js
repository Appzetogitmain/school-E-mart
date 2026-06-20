const mongoose = require('mongoose');

const authSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jti: { type: String, required: true, unique: true }, // JWT ID
  refreshTokenHash: { type: String },
  device: {
    os: { type: String },
    model: { type: String },
    app: { type: String }
  },
  ipAddress: { type: String },
  lastSeenAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date }
}, { collection: 'authSessions' });

// Indexes
authSessionSchema.index({ userId: 1, lastSeenAt: -1 });
// TTL Index
authSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('AuthSession', authSessionSchema);
