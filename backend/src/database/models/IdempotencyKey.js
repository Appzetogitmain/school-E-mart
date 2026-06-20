const mongoose = require('mongoose');

const idempotencyKeySchema = new mongoose.Schema({
  key: { type: String, required: true },
  scope: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responseHash: { type: String },
  expiresAt: { type: Date, required: true }
}, { collection: 'idempotencyKeys', timestamps: false });

// Indexes
idempotencyKeySchema.index({ key: 1, scope: 1 }, { unique: true });
// TTL index
idempotencyKeySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('IdempotencyKey', idempotencyKeySchema);
