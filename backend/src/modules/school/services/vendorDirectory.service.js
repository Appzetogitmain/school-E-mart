const vendorRepository = require('../../vendor/repositories/vendor.repository');

const toPublicVendor = (vendor) => {
  const user = vendor.user || {};
  const city = vendor.address?.city || '';
  const state = vendor.address?.state || '';
  const location = [city, state].filter(Boolean).join(', ') || '—';

  return {
    _id: vendor._id,
    storeName: vendor.storeName,
    name: user.name || vendor.storeName,
    location,
    city,
    state,
    rating: vendor.rating != null ? Number(vendor.rating) : 0,
    ordersCount: vendor.ordersCount || 0,
    verifiedBadge: Boolean(vendor.verifiedBadge),
    primaryCategory: vendor.primaryCategory || null,
  };
};

const vendorDirectoryService = {
  async listApprovedVendors(query = {}) {
    const filter = { approvalStatus: 'approved' };

    if (query.search) {
      filter.$or = [
        { storeName: { $regex: query.search, $options: 'i' } },
        { storeSlug: { $regex: query.search, $options: 'i' } },
      ];
    }

    const { data, pagination } = await vendorRepository.listWithUsers(filter, query);
    return {
      data: data.map(toPublicVendor),
      pagination,
    };
  },
};

module.exports = vendorDirectoryService;
