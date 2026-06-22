const LmsCertificate = require('../../../database/models/LmsCertificate');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class CertificateRepository extends BaseRepository {
  constructor() {
    super(LmsCertificate, { useSoftDelete: false });
  }

  findByCourseAndStudent(courseId, studentId) {
    return this.findOne({ courseId, studentId });
  }

  paginateCertificates(filter, queryString, options = {}) {
    return executePaginatedQuery(LmsCertificate, filter, queryString, {
      defaultSort: '-issuedAt',
      ...options,
    });
  }
}

module.exports = new CertificateRepository();
