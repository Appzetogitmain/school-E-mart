const mongoose = require('mongoose');
const { NotFoundError, BadRequestError } = require('../../../common/errors');
const Reel = require('../../../database/models/Reel');
const ReelInteraction = require('../../../database/models/ReelInteraction');
const ReelComment = require('../../../database/models/ReelComment');
const User = require('../../../database/models/User');
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

  async toggleLike(reelId, userId) {
    const reel = await Reel.findById(reelId);
    if (!reel || reel.softDelete?.isDeleted) {
      throw new NotFoundError('Reel not found', 'REEL_NOT_FOUND');
    }

    const isValidUser = userId && mongoose.Types.ObjectId.isValid(userId);
    const query = isValidUser
      ? { reelId, userId, interactionType: 'like' }
      : { reelId, guestId: 'guest_user', interactionType: 'like' };

    let existing = await ReelInteraction.findOne(query);

    let isLiked = false;
    if (existing) {
      await ReelInteraction.deleteOne({ _id: existing._id });
      reel.metrics = reel.metrics || {};
      reel.metrics.likes = Math.max(0, (reel.metrics.likes || 0) - 1);
      isLiked = false;
    } else {
      await ReelInteraction.create({
        reelId,
        ...(isValidUser ? { userId } : { guestId: 'guest_user' }),
        interactionType: 'like',
      });
      reel.metrics = reel.metrics || {};
      reel.metrics.likes = (reel.metrics.likes || 0) + 1;
      isLiked = true;
    }

    await reel.save();
    return {
      reelId: reel._id,
      isLiked,
      likesCount: reel.metrics.likes,
    };
  },

  async listComments(reelId, query = {}) {
    const reel = await Reel.findById(reelId);
    if (!reel || reel.softDelete?.isDeleted) {
      throw new NotFoundError('Reel not found', 'REEL_NOT_FOUND');
    }

    const comments = await ReelComment.find({
      reelId,
      'softDelete.isDeleted': { $ne: true },
      status: { $ne: 'hidden' },
    })
      .sort({ 'audit.createdAt': -1 })
      .populate('userId', 'fullName name avatarUrl email role')
      .lean();

    const formatted = comments.map((c) => ({
      id: c._id,
      reelId: c.reelId,
      body: c.body,
      user: {
        id: c.userId?._id || c.userId || c._id,
        name: c.userId?.fullName || c.userId?.name || c.guestName || 'School E-Mart Member',
        avatar: c.userId?.avatarUrl || null,
        role: c.userId?.role || 'parent',
      },
      createdAt: c.audit?.createdAt ? new Date(c.audit.createdAt).toISOString() : new Date().toISOString(),
    }));

    return {
      data: formatted,
      total: formatted.length,
      commentsCount: reel.metrics?.comments || formatted.length,
    };
  },

  async addComment(reelId, userId, body) {
    if (!body || !String(body).trim()) {
      throw new BadRequestError('Comment text cannot be empty');
    }

    const reel = await Reel.findById(reelId);
    if (!reel || reel.softDelete?.isDeleted) {
      throw new NotFoundError('Reel not found', 'REEL_NOT_FOUND');
    }

    const isValidUser = userId && mongoose.Types.ObjectId.isValid(userId);
    let user = null;
    if (isValidUser) {
      user = await User.findById(userId).lean();
    }

    const commentData = {
      reelId,
      body: String(body).trim(),
      status: 'active',
    };
    if (isValidUser) {
      commentData.userId = userId;
    } else {
      commentData.guestName = 'School E-Mart Member';
    }

    const comment = await ReelComment.create(commentData);

    reel.metrics = reel.metrics || {};
    reel.metrics.comments = (reel.metrics.comments || 0) + 1;
    await reel.save();

    const formatted = {
      id: comment._id,
      reelId: comment.reelId,
      body: comment.body,
      user: {
        id: user?._id || comment._id,
        name: user?.fullName || user?.name || comment.guestName || 'School E-Mart Member',
        avatar: user?.avatarUrl || null,
        role: user?.role || 'parent',
      },
      createdAt: comment.audit?.createdAt ? new Date(comment.audit.createdAt).toISOString() : new Date().toISOString(),
    };

    return {
      comment: formatted,
      commentsCount: reel.metrics.comments,
    };
  },

  async deleteComment(reelId, commentId, userId, isAdmin = false) {
    const comment = await ReelComment.findById(commentId);
    if (!comment || comment.softDelete?.isDeleted) {
      throw new NotFoundError('Comment not found');
    }

    if (!isAdmin && userId && String(comment.userId) !== String(userId)) {
      throw new BadRequestError('You are not authorized to delete this comment');
    }

    comment.softDelete = { isDeleted: true, deletedAt: new Date() };
    await comment.save();

    const reel = await Reel.findById(reelId);
    if (reel) {
      reel.metrics = reel.metrics || {};
      reel.metrics.comments = Math.max(0, (reel.metrics.comments || 0) - 1);
      await reel.save();
    }

    return { success: true, commentsCount: reel?.metrics?.comments || 0 };
  },
};

module.exports = reelsService;
