const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const { assignmentRepository, assignmentSubmissionRepository } = require('../repositories/assignment.repository');
const courseService = require('./course.service');
const progressService = require('./progress.service');

const assignmentService = {
  async createAssignment(schoolId, courseId, payload) {
    await courseService.getCourse(schoolId, courseId);
    return assignmentRepository.create({
      ...payload,
      schoolId,
      courseId,
      status: payload.status || 'draft',
    });
  },

  async listAssignments(schoolId, courseId, query) {
    await courseService.getCourse(schoolId, courseId);
    const filter = { schoolId, courseId };
    if (query.status) filter.status = query.status;
    return assignmentRepository.paginateAssignments(filter, query);
  },

  async getAssignment(schoolId, courseId, assignmentId) {
    await courseService.getCourse(schoolId, courseId);
    const assignment = await assignmentRepository.findOne({ _id: assignmentId, schoolId, courseId });
    if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    return assignment;
  },

  async updateAssignment(schoolId, courseId, assignmentId, payload) {
    await this.getAssignment(schoolId, courseId, assignmentId);
    const assignment = await assignmentRepository.updateById(assignmentId, { $set: payload }, { schoolId, courseId });
    if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    return assignment;
  },

  async deleteAssignment(schoolId, courseId, assignmentId, deletedBy) {
    await this.getAssignment(schoolId, courseId, assignmentId);
    const assignment = await assignmentRepository.softDeleteById(assignmentId, { deletedBy });
    if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    return assignment;
  },

  async submitAssignment(req, schoolId, courseId, assignmentId, payload) {
    const assignment = await this.getAssignment(schoolId, courseId, assignmentId);
    if (assignment.status !== 'published') {
      throw new BadRequestError('Assignment is not open for submission', 'ASSIGNMENT_NOT_OPEN');
    }

    const student = req.lmsStudent;
    const userId = req.lmsUserId || req.auth.userId;
    const existing = await assignmentSubmissionRepository.findByAssignmentAndStudent(
      assignmentId,
      student._id
    );

    const data = {
      schoolId,
      assignmentId,
      studentId: student._id,
      userId,
      content: payload.content,
      attachments: payload.attachments || [],
      status: 'submitted',
      submittedAt: new Date(),
    };

    if (existing) {
      if (existing.status === 'graded') {
        throw new ConflictError('Assignment already graded', 'ASSIGNMENT_ALREADY_GRADED');
      }
      return assignmentSubmissionRepository.updateById(existing._id, { $set: data });
    }

    return assignmentSubmissionRepository.create(data);
  },

  async evaluateSubmission(schoolId, courseId, assignmentId, submissionId, payload) {
    const assignment = await this.getAssignment(schoolId, courseId, assignmentId);
    const submission = await assignmentSubmissionRepository.findOne({
      _id: submissionId,
      assignmentId,
      schoolId,
    });
    if (!submission) throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');

    if (payload.score > assignment.maxScore) {
      throw new BadRequestError('Score exceeds maximum', 'SCORE_EXCEEDS_MAX');
    }

    const updated = await assignmentSubmissionRepository.updateById(submissionId, {
      $set: {
        score: payload.score,
        feedback: payload.feedback,
        status: 'graded',
      },
    });

    await progressService.recalculateCourseProgress(
      submission.userId,
      schoolId,
      courseId,
      submission.studentId
    );
    return updated;
  },

  async listSubmissions(schoolId, courseId, assignmentId, query) {
    await this.getAssignment(schoolId, courseId, assignmentId);
    return assignmentSubmissionRepository.paginateSubmissions({ schoolId, assignmentId }, query);
  },

  async getMySubmission(req, schoolId, courseId, assignmentId) {
    await this.getAssignment(schoolId, courseId, assignmentId);
    const student = req.lmsStudent;
    if (!student?._id) return null;
    return assignmentSubmissionRepository.findByAssignmentAndStudent(assignmentId, student._id);
  },
};

module.exports = assignmentService;
