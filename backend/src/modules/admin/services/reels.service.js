const { NotFoundError } = require('../../../common/errors');
const Reel = require('../../../database/models/Reel');
const { uniqueSlug } = require('../../lms/utils/slug');
const { reelsRepository } = require('../repositories/reels.repository');

const resolveAttachmentUrl = (attachment) => {
  const storageKey = attachment?.storageKey;
  if (!storageKey) return null;
  if (typeof storageKey === 'string' && /^https?:\/\//i.test(storageKey)) {
    return storageKey;
  }
  return storageKey;
};

const withReelMediaUrls = (reel) => {
  if (!reel) return reel;

  const linkedProduct = reel.linkedProduct
    ? {
        ...reel.linkedProduct,
        imageUrl:
          reel.linkedProduct.imageUrl ||
          resolveAttachmentUrl(reel.linkedProduct.imageId) ||
          null,
      }
    : null;

  return {
    ...reel,
    videoUrl: resolveAttachmentUrl(reel.videoId),
    thumbnailUrl: resolveAttachmentUrl(reel.thumbnailId),
    linkedProduct,
  };
};

const reelsService = {
  async listReels(query) {
    const { data, pagination } = await reelsRepository.paginate({}, query);
    const populated = await Promise.all(
      data.map((reel) => reelsRepository.findPopulatedById(reel._id))
    );
    return {
      data: populated.map(withReelMediaUrls),
      pagination,
    };
  },

  async listPublicReels(query = {}) {
    const filter = { status: 'published' };
    const { data, pagination } = await reelsRepository.paginatePublic(filter, query);
    return {
      data: data.map(withReelMediaUrls),
      pagination,
    };
  },

  async getReel(reelId) {
    const reel = await reelsRepository.findPopulatedById(reelId);
    if (!reel) throw new NotFoundError('Reel not found', 'REEL_NOT_FOUND');
    return withReelMediaUrls(reel);
  },

  async createReel(payload) {
    const slug = await uniqueSlug(Reel, payload.title);
    const reel = await reelsRepository.create({
      ...payload,
      slug,
      status: payload.status || 'draft',
    });
    return this.getReel(reel._id);
  },

  async updateReel(reelId, payload) {
    const reel = await reelsRepository.updateById(reelId, { $set: payload });
    if (!reel) throw new NotFoundError('Reel not found', 'REEL_NOT_FOUND');
    return this.getReel(reelId);
  },

  async deleteReel(reelId, deletedBy) {
    const reel = await reelsRepository.softDeleteById(reelId, { deletedBy });
    if (!reel) throw new NotFoundError('Reel not found', 'REEL_NOT_FOUND');
    return reel;
  },
};

module.exports = reelsService;
