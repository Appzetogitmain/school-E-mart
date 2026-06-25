const mongoose = require('mongoose');

const shiprocketTokenStoreSchema = new mongoose.Schema(
  {
    accessToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'shiprocketTokenStore', timestamps: false }
);

module.exports = mongoose.model('ShiprocketTokenStore', shiprocketTokenStoreSchema);
