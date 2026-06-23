const VendorProfile = require('../../../database/models/VendorProfile');
const User = require('../../../database/models/User');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class VendorRepository extends BaseRepository {
  constructor() {
    super(VendorProfile);
  }

  findByUserId(userId) {
    return this.findOne({ userId });
  }

  findByStoreSlug(storeSlug) {
    return this.findOne({ storeSlug });
  }

  async paginateVendors(filter = {}, queryString = {}, options = {}) {
    return executePaginatedQuery(this.model, this.mergeFilter(filter), queryString, {
      defaultSort: options.defaultSort || '-audit.createdAt',
      ...options,
    });
  }

  async findWithUser(vendorId) {
    const vendor = await this.findById(vendorId);
    if (!vendor) return null;
    const user = await User.findOne({
      _id: vendor.userId,
      'softDelete.isDeleted': { $ne: true },
    }).lean();
    return { ...vendor, user };
  }

  async listWithUsers(filter = {}, queryString = {}) {
    const { data, pagination } = await this.paginateVendors(filter, queryString);
    const userIds = data.map((v) => v.userId);
    const users = await User.find({
      _id: { $in: userIds },
      'softDelete.isDeleted': { $ne: true },
    }).lean();
    const userMap = new Map(users.map((u) => [String(u._id), u]));
    return {
      data: data.map((vendor) => ({
        ...vendor,
        user: userMap.get(String(vendor.userId)) || null,
      })),
      pagination,
    };
  }
}

module.exports = new VendorRepository();
