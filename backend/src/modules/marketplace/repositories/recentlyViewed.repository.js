const RecentlyViewedProduct = require('../../../database/models/RecentlyViewedProduct');
const { BaseRepository } = require('../../../repositories');

class RecentlyViewedRepository extends BaseRepository {
  constructor() {
    super(RecentlyViewedProduct, { useSoftDelete: false });
  }

  upsertView(userId, audience, productId) {
    return this.model
      .findOneAndUpdate(
        { userId, audience, productId },
        { $set: { viewedAt: new Date() }, $setOnInsert: { userId, audience, productId } },
        { upsert: true, new: true, runValidators: true }
      )
      .lean();
  }

  listRecent(userId, audience, limit = 20) {
    return this.findMany({ userId, audience }, { sort: { viewedAt: -1 }, limit });
  }
}

module.exports = new RecentlyViewedRepository();
