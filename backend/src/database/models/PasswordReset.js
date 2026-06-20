const mongoose = require('mongoose');

const passwordResetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date }
}, { collection: 'passwordResets', timestamps: { createdAt: 'createdAt', updatedAt: false } });

// Indexes
// TTL index
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PasswordReset', passwordResetSchema);
