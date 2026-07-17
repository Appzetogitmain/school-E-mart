const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const Attachment = require('../../../database/models/Attachment');
const Student = require('../../../database/models/Student');
const User = require('../../../database/models/User');
const LmsAssignment = require('../../../database/models/LmsAssignment');
const attachmentService = require('../../admin/services/attachment.service');
const triggerService = require('../../../services/notification/trigger.service');
const { assignmentRepository, assignmentSubmissionRepository } = require('../repositories/assignment.repository');
const courseRepository = require('../repositories/course.repository');
const courseService = require('./course.service');
const progressService = require('./progress.service');

// classGrade is free text across the app ("5", "Class 5"), so compare on a normalized
// form rather than the raw strings.
const normalizeGrade = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/class/g, '')
    .replace(/\s+/g, '')
    .trim();

// A submission is late if it arrives after the due date. Assignments without a due date
// can never be late.
const isSubmissionLate = (assignment, at) =>
  Boolean(assignment.dueDate) && at > new Date(assignment.dueDate);

const assignmentService = {
  async createAssignment(schoolId, courseId, payload, actor = {}) {
    const course = await courseService.getCourse(schoolId, courseId);

    let assignedByName = null;
    let assignedByUserId = null;
    if (actor.userId) {
      assignedByUserId = actor.userId;
      const user = await User.findById(actor.userId).select('name').lean();
      assignedByName = user?.name || null;
    }

    const { files, ...assignmentData } = payload;
    const hasFiles = Boolean(files?.length);
    const attachments = hasFiles
      ? await attachmentService.createManyFromBase64({
          ownerUserId: assignedByUserId || actor.userId,
          purpose: 'homework_attachment',
          files,
          prefix: 'homework',
        })
      : [];

    const assignment = await assignmentRepository.create({
      ...assignmentData,
      schoolId,
      courseId,
      // Fall back to the course's grade/subject so the record is self-describing
      // even if the client omits them.
      classGrade: payload.classGrade || course.gradeClass,
      assignedDate: payload.assignedDate || new Date(),
      assignedByUserId,
      assignedByName,
      status: payload.status || 'draft',
      attachments: attachments.map((a) => a._id),
    });

    if (assignment.status === 'published') {
      triggerService.notifyHomeworkPublished(schoolId, assignment, course);
    }

    return assignment;
  },

  async listAssignments(schoolId, courseId, query) {
    await courseService.getCourse(schoolId, courseId);
    const filter = { schoolId, courseId };
    if (query.status) filter.status = query.status;
    return assignmentRepository.paginateAssignments(filter, query);
  },

  async getAssignment(schoolId, courseId, assignmentId) {
    await courseService.getCourse(schoolId, courseId);
    const assignment = await assignmentRepository.findOnePopulated({ _id: assignmentId, schoolId, courseId });
    if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    return assignment;
  },

  async updateAssignment(schoolId, courseId, assignmentId, payload) {
    const before = await this.getAssignment(schoolId, courseId, assignmentId);

    const { files, ...updateData } = payload;
    let attachments = before.attachments || [];
    if (files) {
      const newAttachments = await attachmentService.createManyFromBase64({
        ownerUserId: before.assignedByUserId,
        purpose: 'homework_attachment',
        files,
        prefix: 'homework',
      });
      attachments = newAttachments.map((a) => a._id);
    }

    const assignment = await assignmentRepository.updateById(
      assignmentId,
      { $set: { ...updateData, attachments } },
      { schoolId, courseId }
    );
    if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');

    // Homework drafted first and published later must still reach parents.
    if (before.status !== 'published' && assignment.status === 'published') {
      const course = await courseService.getCourse(schoolId, courseId);
      triggerService.notifyHomeworkPublished(schoolId, assignment, course);
    }

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
      // BadRequestError is (message, errors, code) — unlike its sibling error classes,
      // the code is the third argument, not the second.
      throw new BadRequestError('Assignment is not open for submission', null, 'ASSIGNMENT_NOT_OPEN');
    }

    const student = req.lmsStudent;
    const userId = req.lmsUserId || req.auth.userId;
    const existing = await assignmentSubmissionRepository.findByAssignmentAndStudent(
      assignmentId,
      student._id
    );

    // Graded work is final. Sending it back for revision is the teacher's call, and
    // that reopens submission by moving the status to 'returned'.
    if (existing?.status === 'graded') {
      throw new ConflictError(
        'This homework has already been checked and cannot be resubmitted',
        'ASSIGNMENT_ALREADY_GRADED'
      );
    }

    const content = payload.content?.trim() || '';
    const hasFiles = Boolean(payload.files?.length);
    if (!content && !hasFiles) {
      throw new BadRequestError('Attach the completed work or add a note', null, 'SUBMISSION_EMPTY');
    }

    // Throws with a per-file reason if anything is too large or the wrong type, rather
    // than dropping it and reporting success for work the teacher will never see.
    const attachments = hasFiles
      ? await attachmentService.createManyFromBase64({
          ownerUserId: userId,
          purpose: 'submission',
          files: payload.files,
          prefix: 'homework',
        })
      : [];

    const submittedAt = new Date();
    const data = {
      schoolId,
      assignmentId,
      studentId: student._id,
      userId,
      content,
      attachments: attachments.map((a) => a._id),
      submittedAt,
      isLate: isSubmissionLate(assignment, submittedAt),
      status: 'submitted',
      // A resubmission answers the teacher's request for revision, so clear it.
      returnedAt: null,
    };

    const submission = existing
      ? await assignmentSubmissionRepository.updateById(existing._id, { $set: data })
      : await assignmentSubmissionRepository.create(data);

    triggerService.notifyHomeworkSubmitted(assignment, submission, student);

    return submission;
  },

  async evaluateSubmission(schoolId, courseId, assignmentId, submissionId, payload, actor = {}) {
    const assignment = await this.getAssignment(schoolId, courseId, assignmentId);
    const submission = await assignmentSubmissionRepository.findOne({
      _id: submissionId,
      assignmentId,
      schoolId,
    });
    if (!submission) throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');

    if (submission.status === 'draft') {
      throw new BadRequestError('This work has not been submitted yet', null, 'SUBMISSION_NOT_SUBMITTED');
    }

    const maxScore = assignment.maxScore ?? 100;
    if (payload.score > maxScore) {
      throw new BadRequestError(`Score cannot exceed ${maxScore}`, null, 'SCORE_EXCEEDS_MAX');
    }

    const updated = await assignmentSubmissionRepository.updateById(submissionId, {
      $set: {
        score: payload.score,
        letterGrade: payload.letterGrade || null,
        feedback: payload.feedback,
        gradedAt: new Date(),
        gradedBy: actor.userId || null,
        returnedAt: null,
        status: 'graded',
      },
    });

    triggerService.notifyHomeworkGraded(assignment, updated);

    await progressService.recalculateCourseProgress(
      submission.userId,
      schoolId,
      courseId,
      submission.studentId
    );
    return updated;
  },

  /**
   * Send work back to the student for another attempt. This is the only way out of a
   * graded submission, and it is what reopens submission for that student.
   */
  async returnSubmission(schoolId, courseId, assignmentId, submissionId, payload, actor = {}) {
    const assignment = await this.getAssignment(schoolId, courseId, assignmentId);
    const submission = await assignmentSubmissionRepository.findOne({
      _id: submissionId,
      assignmentId,
      schoolId,
    });
    if (!submission) throw new NotFoundError('Submission not found', 'SUBMISSION_NOT_FOUND');

    if (submission.status === 'draft') {
      throw new BadRequestError('This work has not been submitted yet', null, 'SUBMISSION_NOT_SUBMITTED');
    }

    const updated = await assignmentSubmissionRepository.updateById(submissionId, {
      $set: {
        feedback: payload.feedback,
        status: 'returned',
        returnedAt: new Date(),
        gradedBy: actor.userId || null,
        // The previous score no longer stands once the work is being redone.
        score: null,
        letterGrade: null,
        gradedAt: null,
      },
    });

    triggerService.notifyHomeworkReturned(assignment, updated);

    return updated;
  },

  async listSubmissions(schoolId, courseId, assignmentId, query) {
    await this.getAssignment(schoolId, courseId, assignmentId);
    return assignmentSubmissionRepository.paginateSubmissions({ schoolId, assignmentId }, query);
  },

  /**
   * Every student the homework was set for, each with their submission or null.
   * Joined on the server so the teacher's roster cannot silently lose students to a
   * client-side page limit, and so names and roll numbers always resolve.
   */
  async getSubmissionRoster(schoolId, courseId, assignmentId) {
    const assignment = await this.getAssignment(schoolId, courseId, assignmentId);
    const course = await courseService.getCourse(schoolId, courseId);

    const classGrade = assignment.classGrade || course.gradeClass;
    const students = await Student.find({
      schoolId,
      status: 'active',
      'softDelete.isDeleted': { $ne: true },
      // An assignment with no section targets the whole grade.
      ...(assignment.section ? { section: assignment.section } : {}),
    })
      .select('name rollNo classGrade section')
      .lean();

    const roster = students.filter(
      (student) => normalizeGrade(student.classGrade) === normalizeGrade(classGrade)
    );

    const submissions = await assignmentSubmissionRepository.findAllPopulated({
      schoolId,
      assignmentId,
    });

    const byStudent = new Map(
      submissions.map((submission) => [String(submission.studentId), submission])
    );

    return {
      assignment,
      rows: roster.map((student) => ({
        student,
        submission: byStudent.get(String(student._id)) || null,
      })),
    };
  },

  /**
   * Every published homework for one student, with their submission attached.
   *
   * Filtering by section happens here rather than on the client: a course spans a whole
   * grade, so without it a child in 5-A is shown 5-B's homework. Doing the join server
   * side also collapses what used to be one request per course plus one per assignment.
   */
  async getStudentHomeworkFeed(schoolId, student) {
    const courses = await courseRepository.findMany({ schoolId, status: 'published' });

    const studentGrade = normalizeGrade(student.classGrade);
    const gradeCourses = courses.filter(
      (course) => normalizeGrade(course.gradeClass) === studentGrade
    );
    if (!gradeCourses.length) return [];

    const courseById = new Map(gradeCourses.map((course) => [String(course._id), course]));

    const assignments = await assignmentRepository.findManyPopulated({
      schoolId,
      courseId: { $in: gradeCourses.map((course) => course._id) },
      status: 'published',
      // Homework with no section is set for the whole grade; anything else must match
      // the student's own section.
      $or: [
        { section: student.section },
        { section: { $in: [null, ''] } },
        { section: { $exists: false } },
      ],
    });
    if (!assignments.length) return [];

    const submissions = await assignmentSubmissionRepository.findAllPopulated({
      schoolId,
      studentId: student._id,
      assignmentId: { $in: assignments.map((a) => a._id) },
    });

    const byAssignment = new Map(
      submissions.map((submission) => [String(submission.assignmentId), submission])
    );

    return assignments.map((assignment) => ({
      assignment,
      course: courseById.get(String(assignment.courseId)) || null,
      submission: byAssignment.get(String(assignment._id)) || null,
    }));
  },

  async getMySubmission(req, schoolId, courseId, assignmentId) {
    await this.getAssignment(schoolId, courseId, assignmentId);
    const student = req.lmsStudent;
    if (!student?._id) return null;
    return assignmentSubmissionRepository.findByAssignmentAndStudent(assignmentId, student._id, {
      populate: true,
    });
  },

  /**
   * Resolve an attachment together with the submission or assignment that owns it, so the
   * caller can decide whether this requester is allowed to read a child's work.
   */
  async getAttachmentContext(schoolId, attachmentId) {
    const attachment = await Attachment.findById(attachmentId).lean();
    if (!attachment || !attachmentService.PRIVATE_PURPOSES.has(attachment.purpose)) {
      throw new NotFoundError('Attachment not found', 'ATTACHMENT_NOT_FOUND');
    }

    if (attachment.purpose === 'homework_attachment') {
      const assignment = await LmsAssignment.findOne({
        schoolId,
        attachments: attachment._id,
      }).lean();
      if (!assignment) {
        throw new NotFoundError('Attachment not found', 'ATTACHMENT_NOT_FOUND');
      }
      return { attachment, assignment, isHomeworkAttachment: true };
    } else {
      const submission = await assignmentSubmissionRepository.findOne({
        schoolId,
        attachments: attachment._id,
      });
      if (!submission) {
        throw new NotFoundError('Attachment not found', 'ATTACHMENT_NOT_FOUND');
      }

      const assignment = await LmsAssignment.findOne({ _id: submission.assignmentId, schoolId }).lean();
      if (!assignment) {
        throw new NotFoundError('Attachment not found', 'ATTACHMENT_NOT_FOUND');
      }

      return { attachment, submission, assignment, isHomeworkAttachment: false };
    }
  },
};

module.exports = assignmentService;
