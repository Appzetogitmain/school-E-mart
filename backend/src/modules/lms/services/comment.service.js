const { NotFoundError, ForbiddenError } = require('../../../common/errors');
const commentRepository = require('../repositories/comment.repository');
const lessonService = require('./lesson.service');

const commentService = {
  async addComment(req, schoolId, courseId, lessonId, payload) {
    await lessonService.getLesson(schoolId, courseId, lessonId);
    return commentRepository.create({
      schoolId,
      courseId,
      lessonId,
      userId: req.auth.userId,
      text: payload.text,
      parentCommentId: payload.parentCommentId,
      moderationStatus: 'visible',
    });
  },

  async listComments(schoolId, courseId, lessonId, query) {
    await lessonService.getLesson(schoolId, courseId, lessonId);
    const filter = { schoolId, courseId, lessonId };
    if (!query.includeHidden) filter.moderationStatus = 'visible';
    return commentRepository.paginateComments(filter, query);
  },

  async updateComment(req, schoolId, courseId, lessonId, commentId, payload) {
    const comment = await commentRepository.findOne({ _id: commentId, schoolId, courseId, lessonId });
    if (!comment) throw new NotFoundError('Comment not found', 'COMMENT_NOT_FOUND');
    if (String(comment.userId) !== String(req.auth.userId) && req.auth.role !== 'school' && req.auth.role !== 'admin') {
      throw new ForbiddenError('You can only edit your own comments', 'COMMENT_ACCESS_DENIED');
    }
    return commentRepository.updateById(commentId, { $set: { text: payload.text } });
  },

  async deleteComment(req, schoolId, courseId, lessonId, commentId) {
    const comment = await commentRepository.findOne({ _id: commentId, schoolId, courseId, lessonId });
    if (!comment) throw new NotFoundError('Comment not found', 'COMMENT_NOT_FOUND');
    const canModerate = ['school', 'admin', 'teacher'].includes(req.auth.role);
    if (String(comment.userId) !== String(req.auth.userId) && !canModerate) {
      throw new ForbiddenError('You cannot delete this comment', 'COMMENT_ACCESS_DENIED');
    }
    return commentRepository.softDeleteById(commentId, { deletedBy: req.auth.userId });
  },

  async moderateComment(schoolId, courseId, lessonId, commentId, moderationStatus) {
    const comment = await commentRepository.findOne({ _id: commentId, schoolId, courseId, lessonId });
    if (!comment) throw new NotFoundError('Comment not found', 'COMMENT_NOT_FOUND');
    return commentRepository.updateById(commentId, { $set: { moderationStatus } });
  },
};

module.exports = commentService;
