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

// section is free text too — the teacher's form uppercases it ("A"), the roster may
// hold "a" or "Section A". Comparing the raw strings silently hid a whole section's
// homework, so every section comparison goes through this.
const normalizeSection = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/section/g, '')
    .replace(/\s+/g, '')
    .trim();

// Content targeted at "All Grades" (or at nothing in particular) belongs to every
// class, not to a grade of its own.
const isUniversalGrade = (value) => {
  const normalized = normalizeGrade(value);
  return !normalized || normalized === 'allgrades' || normalized === 'all';
};

// Homework can legitimately hang off a platform course (`schoolId: null`): the access
// policy already resolves one for staff (assertCourseInSchool falls back to it), so a
// lookup here that refused it reported "Course not found" for homework the teacher was
// authorized to file, and left any already filed that way unlistable and ungradeable.
// This only decides whether the course row can be *found* — who may touch it is settled
// by the policy before any of this runs.
const COURSE_SCOPE = { includePlatform: true };

// How much of a school's published homework the parent feed considers, newest first.
// Well above a year of homework for one school, and low enough that the page cannot be
// asked to render an unbounded list.
const HOMEWORK_FEED_LIMIT = 500;

// A submission is late if it arrives after the due date. Assignments without a due date
// can never be late.
const isSubmissionLate = (assignment, at) =>
  Boolean(assignment.dueDate) && at > new Date(assignment.dueDate);

const assignmentService = {
  async createAssignment(schoolId, courseId, payload, actor = {}) {
    const course = await courseService.getCourse(schoolId, courseId, COURSE_SCOPE);

    let assignedByName = null;
    let assignedByUserId = null;
    if (actor.userId) {
      assignedByUserId = actor.userId;
      const user = await User.findById(actor.userId).select('name').lean();
      assignedByName = user?.name || null;
    }

    const { files, bannerFile, removeBanner, ...assignmentData } = payload;
    const hasFiles = Boolean(files?.length);
    const attachments = hasFiles
      ? await attachmentService.createManyFromBase64({
          ownerUserId: assignedByUserId || actor.userId,
          purpose: 'homework_attachment',
          files,
          prefix: 'homework',
        })
      : [];

    // The banner is stored the same way as any other homework attachment — same purpose,
    // same private stream — but as its own field, never mixed into `attachments`.
    let bannerAttachmentId = null;
    if (bannerFile) {
      const [banner] = await attachmentService.createManyFromBase64({
        ownerUserId: assignedByUserId || actor.userId,
        purpose: 'homework_attachment',
        files: [bannerFile],
        prefix: 'homework-banner',
      });
      bannerAttachmentId = banner?._id || null;
    }

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
      bannerAttachmentId,
    });

    if (assignment.status === 'published') {
      triggerService.notifyHomeworkPublished(schoolId, assignment, course);
    }

    return assignment;
  },

  async listAssignments(schoolId, courseId, query) {
    await courseService.getCourse(schoolId, courseId, COURSE_SCOPE);
    const filter = { schoolId, courseId };
    if (query.status) filter.status = query.status;
    return assignmentRepository.paginateAssignments(filter, query);
  },

  async getAssignment(schoolId, courseId, assignmentId) {
    await courseService.getCourse(schoolId, courseId, COURSE_SCOPE);
    const assignment = await assignmentRepository.findOnePopulated({ _id: assignmentId, schoolId, courseId });
    if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
    return assignment;
  },

  async updateAssignment(schoolId, courseId, assignmentId, payload) {
    const before = await this.getAssignment(schoolId, courseId, assignmentId);

    const { files, bannerFile, removeBanner, ...updateData } = payload;
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

    // A new banner replaces the old one; an explicit removal clears it; otherwise the
    // existing banner (if any) is left untouched.
    let bannerAttachmentId = before.bannerAttachmentId || null;
    if (bannerFile) {
      const [banner] = await attachmentService.createManyFromBase64({
        ownerUserId: before.assignedByUserId,
        purpose: 'homework_attachment',
        files: [bannerFile],
        prefix: 'homework-banner',
      });
      bannerAttachmentId = banner?._id || null;
    } else if (removeBanner) {
      bannerAttachmentId = null;
    }

    const assignment = await assignmentRepository.updateById(
      assignmentId,
      { $set: { ...updateData, attachments, bannerAttachmentId } },
      { schoolId, courseId }
    );
    if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');

    // Homework drafted first and published later must still reach parents.
    if (before.status !== 'published' && assignment.status === 'published') {
      const course = await courseService.getCourse(schoolId, courseId, COURSE_SCOPE);
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
    const course = await courseService.getCourse(schoolId, courseId, COURSE_SCOPE);

    const classGrade = assignment.classGrade || course.gradeClass;
    const students = await Student.find({
      schoolId,
      status: 'active',
      'softDelete.isDeleted': { $ne: true },
    })
      .select('name rollNo classGrade section')
      .lean();

    // Both filters run here rather than in the query: section is free text ("A" vs
    // "a" vs "Section A"), and matching it raw dropped students the homework was
    // actually set for — so the teacher graded a roster with people missing from it.
    const targetSection = normalizeSection(assignment.section);
    const roster = students.filter((student) => {
      if (!isUniversalGrade(classGrade) && normalizeGrade(student.classGrade) !== normalizeGrade(classGrade)) {
        return false;
      }
      // An assignment with no section targets the whole grade.
      if (targetSection && normalizeSection(student.section) !== targetSection) return false;
      return true;
    });

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
   * Driven by the assignments, not by the courses. Starting from the course list meant
   * a course the parent's feed could not enumerate — one owned by the platform rather
   * than the school (`schoolId: null`), one still in draft, one targeted at "All
   * Grades" — silently swallowed every piece of homework filed under it. The teacher
   * saw the homework in Manage Homework and the parent saw an empty page. An
   * assignment already carries its own `schoolId`, `classGrade` and `section`, so it
   * can answer "is this for my child?" without its course being reachable at all.
   *
   * Targeting is treated as a filter, never as a gate: homework that does not say
   * which grade or section it is for is school-wide, and a child whose grade is
   * unknown is shown everything rather than nothing.
   */
  async getStudentHomeworkFeed(schoolId, student) {
    // Newest first, and bounded: the whole school's published homework is considered
    // (targeting is settled per assignment below, not by the query), and the client
    // fetches a banner image per row. Years of accumulated homework would otherwise
    // turn one page load into hundreds of requests.
    const assignments = await assignmentRepository.findManyPopulated(
      { schoolId, status: 'published' },
      { sort: { assignedDate: -1, 'audit.createdAt': -1 }, limit: HOMEWORK_FEED_LIMIT }
    );
    if (!assignments.length) return [];

    // Fetched by id — not by school — precisely because the course may be a platform
    // course. It is only needed for display (subject, instructor), so homework whose
    // course has since been deleted still reaches the parent.
    const courseIds = [...new Set(assignments.map((a) => String(a.courseId)).filter(Boolean))];
    const courses = courseIds.length
      ? await courseRepository.findMany({ _id: { $in: courseIds } })
      : [];
    const courseById = new Map(courses.map((course) => [String(course._id), course]));

    const studentGrade = normalizeGrade(student.classGrade);
    const studentSection = normalizeSection(student.section);

    const visible = assignments.filter((assignment) => {
      const course = courseById.get(String(assignment.courseId));
      const targetGrade = assignment.classGrade || course?.gradeClass;
      if (studentGrade && !isUniversalGrade(targetGrade) && normalizeGrade(targetGrade) !== studentGrade) {
        return false;
      }

      // Homework with no section is set for the whole grade; a child with no section
      // on record sees all of the grade's homework rather than none of it.
      const targetSection = normalizeSection(assignment.section);
      if (targetSection && studentSection && targetSection !== studentSection) return false;

      return true;
    });
    if (!visible.length) return [];

    // An unlinked parent has no roster row, so there is nothing of theirs to join to.
    const submissions = student._id
      ? await assignmentSubmissionRepository.findAllPopulated({
          schoolId,
          studentId: student._id,
          assignmentId: { $in: visible.map((a) => a._id) },
        })
      : [];

    const byAssignment = new Map(
      submissions.map((submission) => [String(submission.assignmentId), submission])
    );

    return visible.map((assignment) => ({
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
      // Could be a reference attachment or the banner — both are stored under the same
      // purpose, so either array/field can be the match.
      const assignment = await LmsAssignment.findOne({
        schoolId,
        $or: [{ attachments: attachment._id }, { bannerAttachmentId: attachment._id }],
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
