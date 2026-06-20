const mongoose = require('mongoose');

const otpRequestSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  purpose: { 
    type: String, 
    enum: ['login_parent', 'signup_parent', 'password_reset', 'web_register'],
    required: true
  },
  otpHash: { type: String, required: true },
  length: { type: Number, required: true, enum: [4, 6] },
  attempts: { type: Number, required: true, default: 0 },
  maxAttempts: { type: Number, required: true, default: 5 },
  expiresAt: { type: Date, required: true },
  consumedAt: { type: Date },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { collection: 'otpRequests', timestamps: { createdAt: 'createdAt', updatedAt: false } });

// Indexes
otpRequestSchema.index({ phone: 1, purpose: 1, createdAt: -1 });
// TTL index
otpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OtpRequest', otpRequestSchema);
