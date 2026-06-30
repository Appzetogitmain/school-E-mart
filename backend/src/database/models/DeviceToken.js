const mongoose = require('mongoose');

const deviceTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    platform: {
      type: String,
      enum: ['web', 'app'],
      required: true,
      default: 'web',
    },
    userAgent: { type: String },
    isActive: { type: Boolean, required: true, default: true },
    lastUsedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { collection: 'deviceTokens', timestamps: false }
);

deviceTokenSchema.index({ userId: 1, isActive: 1 });
deviceTokenSchema.index({ token: 1 }, { unique: true });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
