const SORT_MAP = {
  newest: '-audit.createdAt',
  price_asc: 'pricePaise',
  price_desc: '-pricePaise',
  rating: '-ratingAvg',
  popular: '-salesCount',
  bestseller: '-salesCount',
};

const buildProductFilter = (query = {}, { publicOnly = true, vendorId = null } = {}) => {
  const filter = {};
  if (publicOnly) {
    filter.approvalStatus = 'approved';
    filter.publishStatus = 'published';
  } else {
    // Only trusted (admin/vendor) callers may narrow by moderation state; for public
    // callers these stay pinned to approved/published above.
    if (query.approvalStatus) filter.approvalStatus = query.approvalStatus;
    if (query.publishStatus) filter.publishStatus = query.publishStatus;
  }
  if (vendorId) filter.vendorId = vendorId;
  // Storefront audience: User app passes 'users', School module passes 'schools'.
  // Legacy products predate the field, so 'users' also matches missing audience.
  if (query.audience === 'schools') {
    filter.audience = 'schools';
  } else if (query.audience === 'users') {
    filter.audience = { $ne: 'schools' };
  }
  if (query.headerId) filter.headerId = query.headerId;
  if (query.categoryId) filter.categoryId = query.categoryId;
  if (query.subcategoryId) filter.subcategoryId = query.subcategoryId;
  if (query.brand) filter.brand = query.brand;
  if (query.grade) {
    const escaped = query.grade.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { gradeTags: { $size: 0 } },
      { gradeTags: { $exists: false } },
      { gradeTags: { $in: ['All', 'all', 'All Grades', 'all-grades'] } },
      { gradeTags: { $elemMatch: { $regex: new RegExp(`^${escaped}$`, 'i') } } },
      { gradeTags: query.grade }
    ];
  }
  if (query.featured === 'true') filter.gradeTags = { $in: ['featured'] };
  if (query.minPrice || query.maxPrice) {
    filter.pricePaise = {};
    if (query.minPrice) filter.pricePaise.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.pricePaise.$lte = Number(query.maxPrice);
  }
  if (query.minRating) {
    filter.ratingAvg = { $gte: Number(query.minRating) };
  }
  if (query.availability === 'in_stock') filter.stock = { $gt: 0 };
  if (query.availability === 'out_of_stock') filter.stock = 0;

  const exprs = [];
  if (query.availability === 'low_stock') {
    filter.stock = { $gt: 0 };
    exprs.push({ $lte: ['$stock', '$lowStockThreshold'] });
  }
  if (query.offers === 'true') {
    exprs.push({ $gt: ['$originalPricePaise', '$pricePaise'] });
  }
  if (exprs.length === 1) filter.$expr = exprs[0];
  if (exprs.length > 1) filter.$expr = { $and: exprs };

  return filter;
};

const resolveSort = (sortKey) => SORT_MAP[sortKey] || '-audit.createdAt';

module.exports = {
  SORT_MAP,
  buildProductFilter,
  resolveSort,
};
