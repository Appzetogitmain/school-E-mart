const { NotFoundError, ConflictError, BadRequestError } = require('../../../common/errors');
const certificateRepository = require('../repositories/certificate.repository');
const courseService = require('./course.service');

const generateCertificateNo = () =>
  `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const certificateService = {
  async checkEligibility(schoolId, courseId, studentId, userId) {
    await courseService.getCourse(schoolId, courseId);
    const progressService = require('./progress.service');
    const progress = await progressService.getCourseProgress(userId, courseId);
    const eligible = progress.completionPercent >= 100;
    const existing = await certificateRepository.findByCourseAndStudent(courseId, studentId);
    return { eligible, progress, issued: Boolean(existing) };
  },

  async issueIfEligible(schoolId, courseId, studentId, userId, completionPercent) {
    if (completionPercent < 100) {
      throw new BadRequestError('Course not fully completed', null, 'CERTIFICATE_NOT_ELIGIBLE');
    }

    const existing = await certificateRepository.findByCourseAndStudent(courseId, studentId);
    if (existing) return existing;

    return certificateRepository.create({
      schoolId,
      courseId,
      studentId,
      userId,
      certificateNo: generateCertificateNo(),
      completionPercent,
      issuedAt: new Date(),
    });
  },

  async generateCertificate(schoolId, courseId, studentId, userId) {
    const eligibility = await this.checkEligibility(schoolId, courseId, studentId, userId);
    if (!eligibility.eligible) {
      throw new BadRequestError('Completion criteria not met', null, 'CERTIFICATE_NOT_ELIGIBLE');
    }
    if (eligibility.issued) {
      return certificateRepository.findByCourseAndStudent(courseId, studentId);
    }
    const progressService = require('./progress.service');
    const progress = await progressService.getCourseProgress(userId, courseId);
    return this.issueIfEligible(
      schoolId,
      courseId,
      studentId,
      userId,
      progress.completionPercent
    );
  },

  async listCertificates(schoolId, query, userId = null) {
    const filter = { schoolId };
    if (userId) filter.userId = userId;
    if (query.courseId) filter.courseId = query.courseId;
    if (query.studentId) filter.studentId = query.studentId;
    return certificateRepository.paginateCertificates(filter, query);
  },

  async getCertificate(schoolId, certificateId) {
    const certificate = await certificateRepository.findOne({ _id: certificateId, schoolId });
    if (!certificate) throw new NotFoundError('Certificate not found', 'CERTIFICATE_NOT_FOUND');
    return certificate;
  },
};

module.exports = certificateService;
