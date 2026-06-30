const CmsPage = require('../../../database/models/CmsPage');
const Faq = require('../../../database/models/Faq');
const PromoBanner = require('../../../database/models/PromoBanner');
const PromoHomeSection = require('../../../database/models/PromoHomeSection');
const LandingContent = require('../../../database/models/LandingContent');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class CmsPageRepository extends BaseRepository {
  constructor() {
    super(CmsPage);
  }

  paginate(filter, queryString, options = {}) {
    const merged = this.mergeFilter(filter);
    if (queryString.search || queryString.q) {
      const term = queryString.search || queryString.q;
      merged.$or = [{ title: { $regex: term, $options: 'i' } }, { slug: { $regex: term, $options: 'i' } }];
    }
    if (queryString.status) merged.status = queryString.status;
    return executePaginatedQuery(CmsPage, merged, queryString, {
      defaultSort: '-audit.updatedAt',
      ...options,
    });
  }

  findBySlug(slug) {
    return this.findOne({ slug });
  }
}

class FaqRepository extends BaseRepository {
  constructor() {
    super(Faq, { useSoftDelete: false });
  }

  paginate(filter, queryString, options = {}) {
    const merged = { ...filter };
    if (queryString.search || queryString.q) {
      const term = queryString.search || queryString.q;
      merged.$or = [
        { question: { $regex: term, $options: 'i' } },
        { answer: { $regex: term, $options: 'i' } },
      ];
    }
    if (queryString.status) merged.status = queryString.status;
    if (queryString.audience) merged.audience = queryString.audience;
    if (queryString.category) merged.category = queryString.category;
    return executePaginatedQuery(Faq, merged, queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }
}

class PromoBannerRepository extends BaseRepository {
  constructor() {
    super(PromoBanner, { useSoftDelete: false });
  }

  paginate(filter, queryString, options = {}) {
    const merged = { ...filter };
    if (queryString.status) merged.status = queryString.status;
    if (queryString.position) merged.position = queryString.position;
    if (queryString.isActive === 'true' || queryString.isActive === true) {
      merged.status = 'active';
    }
    if (queryString.audience && queryString.audience !== 'all') {
      merged.targetAudience = { $in: [queryString.audience, 'all'] };
    }
    return executePaginatedQuery(PromoBanner, merged, queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }

  async paginatePublic(filter, queryString, options = {}) {
    const merged = { ...filter };
    const { parsePagination, buildPaginationMeta } = require('../../../common/pagination');
    const { page, limit, skip } = parsePagination(queryString, options);

    const [data, total] = await Promise.all([
      PromoBanner.find(merged)
        .sort({ displayOrder: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .populate('imageId', 'storageKey mime')
        .lean(),
      PromoBanner.countDocuments(merged),
    ]);

    return {
      data,
      pagination: buildPaginationMeta({ total, page, limit }),
    };
  }
}

class PromoHomeSectionRepository extends BaseRepository {
  constructor() {
    super(PromoHomeSection, { useSoftDelete: false });
  }

  paginate(filter, queryString, options = {}) {
    const merged = { ...filter };
    if (queryString.status) merged.status = queryString.status;
    return executePaginatedQuery(PromoHomeSection, merged, queryString, {
      defaultSort: 'displayOrder',
      ...options,
    });
  }
}

class LandingContentRepository extends BaseRepository {
  constructor() {
    super(LandingContent, { useSoftDelete: false });
  }

  paginate(filter, queryString, options = {}) {
    const merged = { ...filter };
    if (queryString.status) merged.status = queryString.status;
    return executePaginatedQuery(LandingContent, merged, queryString, {
      defaultSort: '-audit.updatedAt',
      ...options,
    });
  }

  findBySlug(slug) {
    return this.findOne({ slug });
  }
}

module.exports = {
  cmsPageRepository: new CmsPageRepository(),
  faqRepository: new FaqRepository(),
  promoBannerRepository: new PromoBannerRepository(),
  promoHomeSectionRepository: new PromoHomeSectionRepository(),
  landingContentRepository: new LandingContentRepository(),
};
