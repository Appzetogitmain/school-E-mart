const PlatformTutorial = require('../../../database/models/PlatformTutorial');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');
const { parsePagination, buildPaginationMeta } = require('../../../common/pagination');

class TutorialsRepository extends BaseRepository {
  constructor() {
    super(PlatformTutorial);
  }

  paginate(filter, queryString, options = {}) {
    const merged = this.mergeFilter(filter);
    if (queryString.status) merged.status = queryString.status;
    if (queryString.targetAudience) merged.targetAudience = queryString.targetAudience;
    if (queryString.search || queryString.q) {
      const term = queryString.search || queryString.q;
      merged.$or = [
        { title: { $regex: term, $options: 'i' } },
        { description: { $regex: term, $options: 'i' } },
      ];
    }

    return executePaginatedQuery(PlatformTutorial, merged, queryString, {
      defaultSort: 'order -audit.createdAt',
      ...options,
    });
  }

  async findPopulatedById(tutorialId) {
    return PlatformTutorial.findOne(this.mergeFilter({ _id: tutorialId }))
      .populate('videoId', 'storageKey mime')
      .populate('thumbnailId', 'storageKey mime')
      .lean();
  }

  async listForAudience(audience, queryString = {}, options = {}) {
    const merged = this.mergeFilter({
      status: 'published',
      targetAudience: audience === 'all' ? 'all' : { $in: ['all', audience] },
    });

    const { page, limit, skip } = parsePagination(queryString, { limit: 50, ...options });

    const [data, total] = await Promise.all([
      PlatformTutorial.find(merged)
        .sort({ order: 1, 'audit.createdAt': -1 })
        .skip(skip)
        .limit(limit)
        .populate('videoId', 'storageKey mime')
        .populate('thumbnailId', 'storageKey mime')
        .lean(),
      PlatformTutorial.countDocuments(merged),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ total, page, limit }),
    };
  }

  incrementViews(tutorialId) {
    return PlatformTutorial.findOneAndUpdate(
      this.mergeFilter({ _id: tutorialId }),
      { $inc: { 'metrics.views': 1 } },
      { new: true }
    ).lean();
  }
}

module.exports = {
  tutorialsRepository: new TutorialsRepository(),
};
