const Cart = require('../../../database/models/Cart');
const { BaseRepository } = require('../../../repositories');

class CartRepository extends BaseRepository {
  constructor() {
    super(Cart, { useSoftDelete: false });
  }

  findByUser(userId, audience) {
    return this.findOne({ userId, audience });
  }

  upsertCart(userId, audience, data) {
    return this.model
      .findOneAndUpdate(
        { userId, audience },
        { $set: data, $setOnInsert: { userId, audience } },
        { upsert: true, new: true, runValidators: true }
      )
      .lean();
  }
}

module.exports = new CartRepository();
