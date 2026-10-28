const mongoose = require('mongoose');

const socialRewardConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'default' },
    isActive: { type: Boolean, default: true },
    discountPercent: { type: Number, default: 5, min: 1, max: 100 },
    instagramUrl: { type: String, default: 'https://www.instagram.com/schoolemart' },
    youtubeUrl: { type: String, default: 'https://www.youtube.com/@schoolemart' },
    googleReviewUrl: { type: String, default: 'https://g.page/r/schoolemart/review' },
    updatedBy: { type: mongoose.Schema.Types.Mixed },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: 'socialRewardConfig', timestamps: false }
);

module.exports = mongoose.model('SocialRewardConfig', socialRewardConfigSchema);
