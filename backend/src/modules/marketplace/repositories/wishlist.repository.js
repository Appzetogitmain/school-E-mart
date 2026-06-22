const Wishlist = require('../../../database/models/Wishlist');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class WishlistRepository extends BaseRepository {
  constructor() {
    super(Wishlist, { useSoftDelete: false });
  }

  findByUser(userId, audience) {
    return this.findOne({ userId, audience });
  }

  upsertWishlist(userId, audience, items) {
    return this.model
      .findOneAndUpdate(
        { userId, audience },
        { $set: { items }, $setOnInsert: { userId, audience } },
        { upsert: true, new: true, runValidators: true }
      )
      .lean();
  }
}

module.exports = new WishlistRepository();
