const { NotFoundError } = require('../../../common/errors');
const { tutorialsRepository } = require('../repositories/tutorials.repository');

const resolveAttachmentUrl = (attachment) => {
  const storageKey = attachment?.storageKey;
  if (!storageKey) return null;
  return storageKey;
};

const withTutorialMediaUrls = (tutorial) => {
  if (!tutorial) return tutorial;
  return {
    ...tutorial,
    videoUrl: resolveAttachmentUrl(tutorial.videoId),
    thumbnailUrl: resolveAttachmentUrl(tutorial.thumbnailId),
  };
};

const tutorialsService = {
  // Admin management (superadmin console)
  async listTutorials(query) {
    const { data, pagination } = await tutorialsRepository.paginate({}, query);
    const populated = await Promise.all(
      data.map((tutorial) => tutorialsRepository.findPopulatedById(tutorial._id))
    );
    return {
      data: populated.map(withTutorialMediaUrls),
      pagination,
    };
  },

  async getTutorial(tutorialId) {
    const tutorial = await tutorialsRepository.findPopulatedById(tutorialId);
    if (!tutorial) throw new NotFoundError('Tutorial not found', 'TUTORIAL_NOT_FOUND');
    return withTutorialMediaUrls(tutorial);
  },

  async createTutorial(payload) {
    const tutorial = await tutorialsRepository.create({
      ...payload,
      status: payload.status || 'draft',
    });
    return this.getTutorial(tutorial._id);
  },

  async updateTutorial(tutorialId, payload) {
    const tutorial = await tutorialsRepository.updateById(tutorialId, { $set: payload });
    if (!tutorial) throw new NotFoundError('Tutorial not found', 'TUTORIAL_NOT_FOUND');
    return this.getTutorial(tutorialId);
  },

  async deleteTutorial(tutorialId, deletedBy) {
    const tutorial = await tutorialsRepository.softDeleteById(tutorialId, { deletedBy });
    if (!tutorial) throw new NotFoundError('Tutorial not found', 'TUTORIAL_NOT_FOUND');
    return tutorial;
  },

  // Consumption (parent/teacher/school profile — "Learn more about platform")
  async listForAudience(role, query) {
    const { data, pagination } = await tutorialsRepository.listForAudience(role, query);
    return {
      data: data.map(withTutorialMediaUrls),
      pagination,
    };
  },

  async recordView(tutorialId) {
    const tutorial = await tutorialsRepository.incrementViews(tutorialId);
    if (!tutorial) throw new NotFoundError('Tutorial not found', 'TUTORIAL_NOT_FOUND');
    return withTutorialMediaUrls(tutorial);
  },
};

module.exports = tutorialsService;
