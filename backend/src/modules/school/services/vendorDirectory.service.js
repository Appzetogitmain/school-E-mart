const mongoose = require('mongoose');
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
    // Resolving a specific set of vendor ids (e.g. an RFQ's previously-invited
    // vendors) is independent of the browsing list's page/search — and must
    // still resolve a vendor even if their approval status has since changed,
    // so an already-invited vendor never silently vanishes from the editor.
    if (query.ids) {
      const ids = query.ids
        .split(',')
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id));

      if (!ids.length) return { data: [], pagination: null };

      // Note: `ids` must not be forwarded in the queryString — ApiFeatures.filter()
      // merges any unrecognized key straight into the Mongo filter, which would AND
      // in an impossible `{ ids: "a,b,c" }` clause and silently return zero vendors.
      const { data, pagination } = await vendorRepository.listWithUsers(
        { _id: { $in: ids } },
        { limit: ids.length, page: 1 }
      );
      return {
        data: data.map(toPublicVendor),
        pagination,
      };
    }

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
