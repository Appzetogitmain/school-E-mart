const mongoose = require('mongoose');

const reelInteractionSchema = new mongoose.Schema({
  reelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reel', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interactionType: {
    type: String,
    enum: ['view', 'like', 'share'],
    required: true
  },
  at: { type: Date, required: true, default: Date.now }
}, { collection: 'reelInteractions', timestamps: false });

// Indexes
// For views, users can view multiple times, but for likes it's unique
reelInteractionSchema.index({ reelId: 1, userId: 1, interactionType: 1 }, { unique: true, partialFilterExpression: { interactionType: 'like' } });
reelInteractionSchema.index({ reelId: 1, interactionType: 1 });

module.exports = mongoose.model('ReelInteraction', reelInteractionSchema);
