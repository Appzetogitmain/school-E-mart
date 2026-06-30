const { NotFoundError, ConflictError } = require('../../../common/errors');
const {
  cmsPageRepository,
  faqRepository,
  promoBannerRepository,
  promoHomeSectionRepository,
  landingContentRepository,
} = require('../repositories/cms.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const { runAtomic } = require('../../orders/utils/atomic');

const CMS_ENTITY_TYPES = {
  page: 'CmsPage',
  faq: 'Faq',
  banner: 'PromoBanner',
  section: 'PromoHomeSection',
  landing: 'LandingContent',
};

const getRepo = (type) => {
  const map = {
    pages: cmsPageRepository,
    faqs: faqRepository,
    banners: promoBannerRepository,
    sections: promoHomeSectionRepository,
    landing: landingContentRepository,
  };
  return map[type];
};

const cmsService = {
  // Static Pages
  listPages(query) {
    return cmsPageRepository.paginate({}, query);
  },

  async getPage(pageId) {
    const page = await cmsPageRepository.findById(pageId);
    if (!page) throw new NotFoundError('Page not found', 'CMS_PAGE_NOT_FOUND');
    return page;
  },

  async createPage(payload, actor = {}) {
    const existing = await cmsPageRepository.findBySlug(payload.slug);
    if (existing) throw new ConflictError('Page slug already exists', 'CMS_SLUG_EXISTS');

    const page = await cmsPageRepository.create(payload);
    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'cms.page.created',
      entityType: CMS_ENTITY_TYPES.page,
      entityId: page._id,
    });
    return page;
  },

  async updatePage(pageId, payload, actor = {}) {
    const page = await cmsPageRepository.updateById(pageId, { $set: payload });
    if (!page) throw new NotFoundError('Page not found', 'CMS_PAGE_NOT_FOUND');
    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'cms.page.updated',
      entityType: CMS_ENTITY_TYPES.page,
      entityId: pageId,
    });
    return page;
  },

  async deletePage(pageId, actor = {}) {
    const page = await cmsPageRepository.softDeleteById(pageId, { deletedBy: actor.userId });
    if (!page) throw new NotFoundError('Page not found', 'CMS_PAGE_NOT_FOUND');
    return page;
  },

  async publishPage(pageId, actor = {}) {
    return this._setPageStatus(pageId, 'published', 'cms.page.published', actor);
  },

  async unpublishPage(pageId, actor = {}) {
    return this._setPageStatus(pageId, 'draft', 'cms.page.unpublished', actor);
  },

  async _setPageStatus(pageId, status, action, actor) {
    const page = await cmsPageRepository.updateById(pageId, { $set: { status } });
    if (!page) throw new NotFoundError('Page not found', 'CMS_PAGE_NOT_FOUND');
    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action,
      entityType: CMS_ENTITY_TYPES.page,
      entityId: pageId,
      after: { status },
    });
    return page;
  },

  // FAQs
  listFaqs(query) {
    return faqRepository.paginate({}, query);
  },

  async getFaq(faqId) {
    const faq = await faqRepository.findById(faqId);
    if (!faq) throw new NotFoundError('FAQ not found', 'FAQ_NOT_FOUND');
    return faq;
  },

  async createFaq(payload, actor = {}) {
    const faq = await faqRepository.create(payload);
    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'cms.faq.created',
      entityType: CMS_ENTITY_TYPES.faq,
      entityId: faq._id,
    });
    return faq;
  },

  async updateFaq(faqId, payload, actor = {}) {
    const faq = await faqRepository.updateById(faqId, { $set: payload });
    if (!faq) throw new NotFoundError('FAQ not found', 'FAQ_NOT_FOUND');
    return faq;
  },

  async deleteFaq(faqId) {
    const faq = await faqRepository.findById(faqId);
    if (!faq) throw new NotFoundError('FAQ not found', 'FAQ_NOT_FOUND');
    await faqRepository.model.deleteOne({ _id: faqId });
    return faq;
  },

  // Banners
  listBanners(query) {
    return promoBannerRepository.paginate({}, query);
  },

  listPublicBanners(query = {}) {
    const now = new Date();
    const filter = {
      status: 'active',
      validFrom: { $lte: now },
      validUntil: { $gte: now },
    };

    if (query.position) {
      filter.position = query.position;
    }

    if (query.audience && query.audience !== 'all') {
      filter.targetAudience = { $in: [query.audience, 'all'] };
    }

    return promoBannerRepository.paginatePublic(filter, query);
  },

  async getBanner(bannerId) {
    const banner = await promoBannerRepository.findById(bannerId);
    if (!banner) throw new NotFoundError('Banner not found', 'BANNER_NOT_FOUND');
    return banner;
  },

  async createBanner(payload, actor = {}) {
    return promoBannerRepository.create(payload);
  },

  async updateBanner(bannerId, payload) {
    const banner = await promoBannerRepository.updateById(bannerId, { $set: payload });
    if (!banner) throw new NotFoundError('Banner not found', 'BANNER_NOT_FOUND');
    return banner;
  },

  async deleteBanner(bannerId) {
    const banner = await promoBannerRepository.findById(bannerId);
    if (!banner) throw new NotFoundError('Banner not found', 'BANNER_NOT_FOUND');
    await promoBannerRepository.model.deleteOne({ _id: bannerId });
    return banner;
  },

  // Homepage Sections
  listSections(query) {
    return promoHomeSectionRepository.paginate({}, query);
  },

  async getSection(sectionId) {
    const section = await promoHomeSectionRepository.findById(sectionId);
    if (!section) throw new NotFoundError('Section not found', 'SECTION_NOT_FOUND');
    return section;
  },

  async createSection(payload) {
    return promoHomeSectionRepository.create(payload);
  },

  async updateSection(sectionId, payload) {
    const section = await promoHomeSectionRepository.updateById(sectionId, { $set: payload });
    if (!section) throw new NotFoundError('Section not found', 'SECTION_NOT_FOUND');
    return section;
  },

  async deleteSection(sectionId) {
    const section = await promoHomeSectionRepository.findById(sectionId);
    if (!section) throw new NotFoundError('Section not found', 'SECTION_NOT_FOUND');
    await promoHomeSectionRepository.model.deleteOne({ _id: sectionId });
    return section;
  },

  // Landing / Contact / About
  listLandingContent(query) {
    return landingContentRepository.paginate({}, query);
  },

  async getLandingBySlug(slug) {
    const content = await landingContentRepository.findBySlug(slug);
    if (!content) throw new NotFoundError('Content not found', 'LANDING_NOT_FOUND');
    return content;
  },

  async upsertLanding(slug, payload, actor = {}) {
    const existing = await landingContentRepository.findBySlug(slug);
    if (existing) {
      return landingContentRepository.updateById(existing._id, { $set: payload });
    }
    return landingContentRepository.create({ slug, ...payload });
  },

  async getTermsAndConditions() {
    return cmsPageRepository.findBySlug('terms-conditions');
  },

  async getPrivacyPolicy() {
    return cmsPageRepository.findBySlug('privacy-policy');
  },

  async getAboutUs() {
    return landingContentRepository.findBySlug('about');
  },

  async getContactInfo() {
    return landingContentRepository.findBySlug('contact');
  },

  async setStatus(resourceType, resourceId, status, actor = {}) {
    const repo = getRepo(resourceType);
    if (!repo) throw new NotFoundError('Invalid resource type', 'INVALID_RESOURCE');

    const updated = await repo.updateById(resourceId, { $set: { status } });
    if (!updated) throw new NotFoundError('Resource not found', 'RESOURCE_NOT_FOUND');

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: `cms.${resourceType}.status_updated`,
      entityType: CMS_ENTITY_TYPES[resourceType.replace(/s$/, '')] || resourceType,
      entityId: resourceId,
      after: { status },
    });

    return updated;
  },
};

module.exports = cmsService;
