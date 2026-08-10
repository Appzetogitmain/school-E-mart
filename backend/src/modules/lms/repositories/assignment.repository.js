const LmsAssignment = require('../../../database/models/LmsAssignment');
const LmsAssignmentSubmission = require('../../../database/models/LmsAssignmentSubmission');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

// The teacher and the parent both need the actual files, not the attachment ids.
const ATTACHMENT_FIELDS = 'storageKey mime sizeBytes purpose';

class AssignmentRepository extends BaseRepository {
  constructor() {
    super(LmsAssignment);
  }

  paginateAssignments(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsAssignment, this.mergeFilter(filter), queryString, {
      defaultSort: '-dueDate',
      populate: [
        { path: 'attachments', select: ATTACHMENT_FIELDS },
        { path: 'bannerAttachmentId', select: ATTACHMENT_FIELDS },
      ],
      ...options,
    });
  }

  findOnePopulated(filter) {
    return LmsAssignment.findOne(this.mergeFilter(filter))
      .populate('attachments', ATTACHMENT_FIELDS)
      .populate('bannerAttachmentId', ATTACHMENT_FIELDS)
      .lean();
  }

  findManyPopulated(filter) {
    return LmsAssignment.find(this.mergeFilter(filter))
      .populate('attachments', ATTACHMENT_FIELDS)
      .populate('bannerAttachmentId', ATTACHMENT_FIELDS)
      .lean();
  }
}

class AssignmentSubmissionRepository extends BaseRepository {
  constructor() {
    super(LmsAssignmentSubmission, { useSoftDelete: false });
  }

  findByAssignmentAndStudent(assignmentId, studentId, { populate = false } = {}) {
    if (!populate) return this.findOne({ assignmentId, studentId });
    return LmsAssignmentSubmission.findOne({ assignmentId, studentId })
      .populate('attachments', ATTACHMENT_FIELDS)
      .lean();
  }

  findAllPopulated(filter) {
    return LmsAssignmentSubmission.find(filter)
      .populate('attachments', ATTACHMENT_FIELDS)
      .lean();
  }

  paginateSubmissions(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsAssignmentSubmission, filter, queryString, {
      defaultSort: '-submittedAt',
      populate: { path: 'attachments', select: ATTACHMENT_FIELDS },
      ...options,
    });
  }
}

module.exports = {
  assignmentRepository: new AssignmentRepository(),
  assignmentSubmissionRepository: new AssignmentSubmissionRepository(),
};
