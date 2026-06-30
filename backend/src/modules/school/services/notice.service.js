const { NotFoundError, ForbiddenError } = require('../../../common/errors');
const { roles } = require('../../../constants');
const noticeRepository = require('../repositories/notice.repository');
const { triggerService } = require('../../../services/notification');

const { ROLES } = roles;

const isNoticeVisibleToParent = (notice, student) => {
  if (notice.status !== 'published') return false;

  const now = new Date();
  if (notice.publishDate && new Date(notice.publishDate) > now) return false;
  if (notice.expiryDate && new Date(notice.expiryDate) < now) return false;

  if (['all', 'parents'].includes(notice.targetAudience)) return true;

  if (notice.targetAudience === 'specific_classes' && student) {
    return (notice.targetClasses || []).some(
      (entry) =>
        entry.classGrade === student.classGrade &&
        (!entry.sections?.length || entry.sections.includes(student.section))
    );
  }

  return false;
};

const buildParentNoticeFilter = async (schoolId, userId, studentId) => {
  const studentLookup = require('../../lms/repositories/student.repository');
  const resolved = await studentLookup.resolveStudentForUser(schoolId, userId, studentId);
  if (!resolved?.student) {
    throw new ForbiddenError('Student context is required', 'STUDENT_REQUIRED');
  }

  const student = resolved.student;
  const now = new Date();

  return {
    schoolId,
    status: 'published',
    publishDate: { $lte: now },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
    $and: [
      {
        $or: [
          { targetAudience: { $in: ['all', 'parents'] } },
          {
            targetAudience: 'specific_classes',
            targetClasses: {
              $elemMatch: {
                classGrade: student.classGrade,
                $or: [
                  { sections: { $size: 0 } },
                  { sections: { $exists: false } },
                  { sections: student.section },
                ],
              },
            },
          },
        ],
      },
    ],
  };
};

const noticeService = {
  async createNotice(schoolId, payload) {
    const notice = await noticeRepository.create({
      ...payload,
      schoolId,
      status: payload.status || 'draft',
      publishDate: payload.publishDate || new Date(),
    });

    if (notice.status === 'published') {
      triggerService.notifySchoolNoticePublished(schoolId, notice);
    }

    return notice;
  },

  async listNotices(req, schoolId, query) {
    if (req.auth.role === ROLES.PARENT) {
      const filter = await buildParentNoticeFilter(schoolId, req.auth.userId, query.studentId);
      return noticeRepository.paginateNotices(filter, query);
    }

    const filter = { schoolId };
    if (query.status) filter.status = query.status;
    if (query.targetAudience) filter.targetAudience = query.targetAudience;
    return noticeRepository.paginateNotices(filter, query);
  },

  async getNotice(req, schoolId, noticeId) {
    const notice = await noticeRepository.findOne({ _id: noticeId, schoolId });
    if (!notice) throw new NotFoundError('Notice not found', 'NOTICE_NOT_FOUND');

    if (req.auth.role === ROLES.PARENT) {
      const studentLookup = require('../../lms/repositories/student.repository');
      const resolved = await studentLookup.resolveStudentForUser(
        schoolId,
        req.auth.userId,
        req.query.studentId
      );
      if (!resolved?.student || !isNoticeVisibleToParent(notice, resolved.student)) {
        throw new ForbiddenError('Notice is not available', 'NOTICE_ACCESS_DENIED');
      }
    }

    return notice;
  },

  async updateNotice(schoolId, noticeId, payload) {
    const notice = await noticeRepository.updateById(noticeId, { $set: payload }, { schoolId });
    if (!notice) throw new NotFoundError('Notice not found', 'NOTICE_NOT_FOUND');
    return notice;
  },

  async setNoticeStatus(schoolId, noticeId, status) {
    const notice = await this.updateNotice(schoolId, noticeId, { status });
    if (status === 'published') {
      triggerService.notifySchoolNoticePublished(schoolId, notice);
    }
    return notice;
  },

  async deleteNotice(schoolId, noticeId, deletedBy) {
    const notice = await noticeRepository.softDeleteById(noticeId, { deletedBy });
    if (!notice) throw new NotFoundError('Notice not found', 'NOTICE_NOT_FOUND');
    return notice;
  },
};

module.exports = noticeService;
