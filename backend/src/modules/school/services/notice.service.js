const { NotFoundError, ForbiddenError } = require('../../../common/errors');
const { roles } = require('../../../constants');
const noticeRepository = require('../repositories/notice.repository');
const NoticeAcknowledgement = require('../../../database/models/NoticeAcknowledgement');
const { triggerService } = require('../../../services/notification');

const { ROLES } = roles;

const isNoticeVisibleToParent = (notice, student) => {
  if (notice.status !== 'published') return false;

  const now = new Date();
  const nowWithBuffer = new Date(now.getTime() + 5 * 60 * 1000);
  if (notice.publishDate && new Date(notice.publishDate) > nowWithBuffer) return false;
  if (notice.expiryDate && new Date(notice.expiryDate) < now) return false;

  if (['all', 'parents', 'students'].includes(notice.targetAudience)) return true;

  if (notice.targetAudience === 'specific_classes') {
    if (!student) return true;

    const studentGrades = new Set([
      student.classGrade,
      student.classGrade ? String(student.classGrade).trim() : '',
      student.classGrade ? String(student.classGrade).replace(/^class\s+/i, '').trim() : '',
      student.classGrade ? `Class ${String(student.classGrade).replace(/^class\s+/i, '').trim()}` : '',
    ]);

    return (notice.targetClasses || []).some((entry) => {
      const entryGrade = entry.classGrade ? String(entry.classGrade).trim() : '';
      const entryGradeNorm = entryGrade.replace(/^class\s+/i, '').trim();
      const isGradeMatch =
        studentGrades.has(entryGrade) ||
        studentGrades.has(entryGradeNorm) ||
        studentGrades.has(`Class ${entryGradeNorm}`);

      const isSectionMatch =
        !entry.sections?.length || entry.sections.includes(student.section);
      return isGradeMatch && isSectionMatch;
    });
  }

  return false;
};

const buildParentNoticeFilter = async (schoolId, userId, studentId) => {
  const studentLookup = require('../../lms/repositories/student.repository');
  // A child the school has not rostered yet still has a grade on their ChildProfile,
  // so scope to it rather than falling all the way back to every published notice.
  const resolved = await studentLookup.resolveLearnerContext(schoolId, userId, studentId);
  const now = new Date();
  const nowWithBuffer = new Date(now.getTime() + 5 * 60 * 1000);

  const baseFilter = {
    schoolId,
    status: 'published',
    publishDate: { $lte: nowWithBuffer },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
  };

  if (!resolved?.student) {
    // If specific student profile is pending, display all published notices intended for general audiences or specific classes
    return baseFilter;
  }

  const student = resolved.student;
  const studentGradeRaw = student.classGrade ? String(student.classGrade).trim() : '';
  const studentGradeNum = studentGradeRaw.replace(/^class\s+/i, '').trim();
  const studentGradeWithPrefix = studentGradeNum ? `Class ${studentGradeNum}` : '';

  const studentGradeVariants = Array.from(
    new Set([studentGradeRaw, studentGradeNum, studentGradeWithPrefix])
  ).filter(Boolean);

  return {
    ...baseFilter,
    $and: [
      {
        $or: [
          { targetAudience: { $in: ['all', 'parents', 'students'] } },
          {
            targetAudience: 'specific_classes',
            targetClasses: {
              $elemMatch: {
                classGrade: { $in: studentGradeVariants },
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
  async createNotice(schoolId, payload, createdBy) {
    const publishDate = payload.publishDate ? new Date(payload.publishDate) : new Date();
    const isNowOrPast = publishDate.getTime() <= Date.now() + 5000;

    const notice = await noticeRepository.create({
      ...payload,
      schoolId,
      status: payload.status || 'draft',
      publishDate,
      isNotified: payload.status === 'published' && isNowOrPast,
      ...(createdBy ? { 'audit.createdBy': createdBy } : {}),
    });

    if (notice.status === 'published' && isNowOrPast) {
      triggerService.notifySchoolNoticePublished(schoolId, notice);
    }

    return notice;
  },

  async processScheduledNotices() {
    const Notice = require('../../../database/models/Notice');
    const now = new Date();
    const dueNotices = await Notice.find({
      status: 'published',
      isNotified: { $ne: true },
      publishDate: { $lte: now },
      'softDelete.isDeleted': { $ne: true }
    });

    if (!dueNotices.length) return;

    for (const notice of dueNotices) {
      try {
        await triggerService.notifySchoolNoticePublished(notice.schoolId, notice);
        notice.isNotified = true;
        await notice.save();
      } catch (err) {
        console.error(`Failed to dispatch scheduled notice ${notice._id}:`, err);
      }
    }
  },

  async listNotices(req, schoolId, query) {
    const { studentId, ...cleanQuery } = query || {};
    const role = (req.auth?.role || '').toLowerCase();
    const userId = req.auth?.userId;

    if ([ROLES.PARENT, 'user', 'parent'].includes(role)) {
      const filter = await buildParentNoticeFilter(schoolId, userId, studentId);
      const result = await noticeRepository.paginateNotices(filter, cleanQuery);
      return this.decorateWithAcknowledgement(result, userId);
    }

    if ([ROLES.TEACHER, 'teacher'].includes(role)) {
      const now = new Date();
      const nowWithBuffer = new Date(now.getTime() + 5 * 60 * 1000);
      const filter = {
        schoolId,
        $or: [
          // Notices created by this specific teacher (they can see their draft and sent notices)
          { 'audit.createdBy': userId },
          // Notices published by school admin targeted to teachers or all
          {
            status: 'published',
            publishDate: { $lte: nowWithBuffer },
            $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
            targetAudience: { $in: ['all', 'teachers', 'staff'] }
          }
        ]
      };
      if (cleanQuery.status) filter.status = cleanQuery.status;
      return noticeRepository.paginateNotices(filter, cleanQuery);
    }

    const filter = { schoolId };
    if (cleanQuery.status) filter.status = cleanQuery.status;
    if (cleanQuery.targetAudience) filter.targetAudience = cleanQuery.targetAudience;
    return noticeRepository.paginateNotices(filter, cleanQuery);
  },

  /**
   * Stamp each notice with this parent's own acknowledgement state. Resolved in
   * one query for the whole page rather than per notice.
   */
  async decorateWithAcknowledgement(result, userId) {
    const notices = result?.data || [];
    if (!notices.length) return result;

    const acks = await NoticeAcknowledgement.find({
      userId,
      noticeId: { $in: notices.map((n) => n._id) },
    })
      .select('noticeId acknowledgedAt')
      .lean();

    const byNotice = new Map(acks.map((a) => [String(a.noticeId), a.acknowledgedAt]));
    return {
      ...result,
      data: notices.map((notice) => {
        const plain = typeof notice.toObject === 'function' ? notice.toObject() : notice;
        const acknowledgedAt = byNotice.get(String(plain._id)) || null;
        return { ...plain, isAcknowledged: Boolean(acknowledgedAt), acknowledgedAt };
      }),
    };
  },

  /**
   * Record that this parent has read the notice. Idempotent: acknowledging twice
   * keeps the original timestamp rather than erroring or moving it.
   */
  async acknowledgeNotice(req, schoolId, noticeId) {
    // Reuses the parent visibility check — a notice you cannot see, you cannot acknowledge
    await this.getNotice(req, schoolId, noticeId);

    const userId = req.auth.userId;
    await NoticeAcknowledgement.updateOne(
      { noticeId, userId },
      { $setOnInsert: { noticeId, userId, schoolId, acknowledgedAt: new Date() } },
      { upsert: true }
    );

    const ack = await NoticeAcknowledgement.findOne({ noticeId, userId }).lean();
    return { acknowledged: true, acknowledgedAt: ack.acknowledgedAt };
  },

  async getNotice(req, schoolId, noticeId) {
    const notice = await noticeRepository.findOne({ _id: noticeId, schoolId }, null, {
      populate: { path: 'attachments', select: 'storageKey mime sizeBytes purpose' },
    });
    if (!notice) throw new NotFoundError('Notice not found', 'NOTICE_NOT_FOUND');

    const role = (req.auth?.role || '').toLowerCase();
    const userId = req.auth?.userId;

    if ([ROLES.PARENT, 'user', 'parent'].includes(role)) {
      const studentLookup = require('../../lms/repositories/student.repository');
      // The list already falls back for a child the school has not rostered yet
      // (buildParentNoticeFilter); opening one of those notices must not then 403.
      const resolved = await studentLookup.resolveLearnerContext(
        schoolId,
        userId,
        req.query.studentId
      );
      if (!resolved?.student || !isNoticeVisibleToParent(notice, resolved.student)) {
        throw new ForbiddenError('Notice is not available', 'NOTICE_ACCESS_DENIED');
      }
    }

    if ([ROLES.TEACHER, 'teacher'].includes(role)) {
      const isCreator = notice.audit?.createdBy && String(notice.audit.createdBy) === String(userId);
      const isTargetedToTeacher = ['all', 'teachers', 'staff'].includes(notice.targetAudience) && notice.status === 'published';
      if (!isCreator && !isTargetedToTeacher) {
        throw new ForbiddenError('Notice is not available', 'NOTICE_ACCESS_DENIED');
      }
    }

    return notice;
  },

  async updateNotice(schoolId, noticeId, payload, req) {
    const oldNotice = await noticeRepository.findOne({ _id: noticeId, schoolId });
    if (!oldNotice) throw new NotFoundError('Notice not found', 'NOTICE_NOT_FOUND');

    if (req?.auth?.role && ['teacher', ROLES.TEACHER].includes((req.auth.role).toLowerCase())) {
      if (String(oldNotice.audit?.createdBy) !== String(req.auth.userId)) {
        throw new ForbiddenError('Teachers can only edit their own notices', 'NOTICE_EDIT_DENIED');
      }
    }

    const notice = await noticeRepository.updateById(noticeId, { $set: payload }, { schoolId });
    if (payload.status === 'published' && oldNotice?.status !== 'published') {
      triggerService.notifySchoolNoticePublished(schoolId, notice);
    }
    return notice;
  },

  async setNoticeStatus(schoolId, noticeId, status, req) {
    const notice = await this.updateNotice(schoolId, noticeId, { status }, req);
    return notice;
  },

  async deleteNotice(schoolId, noticeId, deletedBy, req) {
    const noticeToDel = await noticeRepository.findOne({ _id: noticeId, schoolId });
    if (!noticeToDel) throw new NotFoundError('Notice not found', 'NOTICE_NOT_FOUND');

    if (req?.auth?.role && ['teacher', ROLES.TEACHER].includes((req.auth.role).toLowerCase())) {
      if (String(noticeToDel.audit?.createdBy) !== String(req.auth.userId)) {
        throw new ForbiddenError('Teachers can only delete their own notices', 'NOTICE_DELETE_DENIED');
      }
    }

    const notice = await noticeRepository.softDeleteById(noticeId, { deletedBy });
    return notice;
  },
};

module.exports = noticeService;
