const LmsAssignment = require('../../../database/models/LmsAssignment');
const LmsAssignmentSubmission = require('../../../database/models/LmsAssignmentSubmission');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class AssignmentRepository extends BaseRepository {
  constructor() {
    super(LmsAssignment);
  }

  paginateAssignments(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsAssignment, this.mergeFilter(filter), queryString, {
      defaultSort: '-dueDate',
      ...options,
    });
  }
}

class AssignmentSubmissionRepository extends BaseRepository {
  constructor() {
    super(LmsAssignmentSubmission, { useSoftDelete: false });
  }

  findByAssignmentAndStudent(assignmentId, studentId) {
    return this.findOne({ assignmentId, studentId });
  }

  paginateSubmissions(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsAssignmentSubmission, filter, queryString, {
      defaultSort: '-submittedAt',
      ...options,
    });
  }
}

module.exports = {
  assignmentRepository: new AssignmentRepository(),
  assignmentSubmissionRepository: new AssignmentSubmissionRepository(),
};
