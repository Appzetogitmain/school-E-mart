const Reel = require('../../../database/models/Reel');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class ReelsRepository extends BaseRepository {
  constructor() {
    super(Reel);
  }

  paginate(filter, queryString, options = {}) {
    const merged = this.mergeFilter(filter);
    if (queryString.status) merged.status = queryString.status;
    if (queryString.targetApp) merged.targetApp = queryString.targetApp;
    if (queryString.category && queryString.category !== 'All') {
      merged.category = queryString.category;
    }
    if (queryString.search || queryString.q) {
      const term = queryString.search || queryString.q;
      merged.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
        { storeName: { $regex: term, $options: 'i' } },
      ];
    }

    return executePaginatedQuery(Reel, merged, queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }

  async findPopulatedById(reelId) {
    return Reel.findOne(this.mergeFilter({ _id: reelId }))
      .populate('videoId', 'storageKey mime')
      .populate('thumbnailId', 'storageKey mime')
      .populate('linkedProduct.imageId', 'storageKey mime')
      .lean();
  }

  async paginatePublic(filter, queryString, options = {}) {
    const merged = { ...this.mergeFilter(filter) };
    if (queryString.category && queryString.category !== 'All') {
      merged.category = queryString.category;
    }
    if (queryString.targetApp) {
      if (queryString.targetApp === 'parent' || queryString.targetApp === 'school') {
        merged.targetApp = { $in: [queryString.targetApp, 'both'] };
      } else {
        merged.targetApp = queryString.targetApp;
      }
    }

    const { parsePagination, buildPaginationMeta } = require('../../../common/pagination');
    const { page, limit, skip } = parsePagination(queryString, options);

    const [data, total] = await Promise.all([
      Reel.find(merged)
        .sort({ 'audit.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .populate('videoId', 'storageKey mime')
        .populate('thumbnailId', 'storageKey mime')
        .populate('linkedProduct.imageId', 'storageKey mime')
        .lean(),
      Reel.countDocuments(merged),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ total, page, limit }),
    };
  }
}

module.exports = {
  reelsRepository: new ReelsRepository(),
};
