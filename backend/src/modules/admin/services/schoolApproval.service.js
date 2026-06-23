const { NotFoundError, BadRequestError } = require('../../../common/errors');
const schoolRepository = require('../../school/repositories/school.repository');
const schoolService = require('../../school/services/school.service');
const auditRepository = require('../../auth/repositories/audit.repository');
const reportRepository = require('../repositories/report.repository');
const User = require('../../../database/models/User');
const { runAtomic } = require('../../orders/utils/atomic');

const SCHOOL_ACTIONS = ['school.approved', 'school.rejected', 'school.suspended', 'school.reactivated'];

const schoolApprovalService = {
  listPendingSchools(query) {
    return schoolRepository.paginateSchools({ partnerStatus: 'prospect' }, query);
  },

  listSchools(query) {
    const filter = {};
    if (query.partnerStatus) filter.partnerStatus = query.partnerStatus;
    if (query.search || query.q) {
      const term = query.search || query.q;
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { code: { $regex: term, $options: 'i' } },
        { schoolRefNo: { $regex: term, $options: 'i' } },
      ];
    }
    return schoolRepository.paginateSchools(filter, query);
  },

  getSchool(schoolId) {
    return schoolService.getSchool(schoolId);
  },

  async approveSchool(schoolId, actor = {}, note) {
    return runAtomic(async () => {
      const school = await schoolRepository.findById(schoolId);
      if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
      if (school.partnerStatus === 'active') {
        throw new BadRequestError('School is already approved', null, 'SCHOOL_ALREADY_APPROVED');
      }

      const updated = await schoolRepository.updateById(schoolId, {
        $set: { partnerStatus: 'active' },
      });

      await User.updateMany({ tenantSchoolId: schoolId, role: 'school' }, { $set: { status: 'active' } });

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'school.approved',
        entityType: 'School',
        entityId: schoolId,
        after: { note },
      });

      return updated;
    });
  },

  async rejectSchool(schoolId, actor = {}, reason) {
    return runAtomic(async () => {
      const school = await schoolRepository.findById(schoolId);
      if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

      const updated = await schoolRepository.updateById(schoolId, {
        $set: { partnerStatus: 'prospect' },
      });

      await User.updateMany({ tenantSchoolId: schoolId, role: 'school' }, { $set: { status: 'inactive' } });

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'school.rejected',
        entityType: 'School',
        entityId: schoolId,
        after: { reason },
      });

      return updated;
    });
  },

  async suspendSchool(schoolId, actor = {}, reason) {
    return runAtomic(async () => {
      const school = await schoolRepository.findById(schoolId);
      if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

      const updated = await schoolRepository.updateById(schoolId, {
        $set: { partnerStatus: 'suspended' },
      });

      await User.updateMany({ tenantSchoolId: schoolId }, { $set: { status: 'suspended' } });

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'school.suspended',
        entityType: 'School',
        entityId: schoolId,
        after: { reason },
      });

      return updated;
    });
  },

  async reactivateSchool(schoolId, actor = {}, note) {
    return runAtomic(async () => {
      const school = await schoolRepository.findById(schoolId);
      if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');

      const updated = await schoolRepository.updateById(schoolId, {
        $set: { partnerStatus: 'active' },
      });

      await User.updateMany({ tenantSchoolId: schoolId }, { $set: { status: 'active' } });

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'school.reactivated',
        entityType: 'School',
        entityId: schoolId,
        after: { note },
      });

      return updated;
    });
  },

  getApprovalHistory(schoolId, query = {}) {
    return reportRepository.paginateAuditLogs(
      {
        entityType: 'School',
        entityId: schoolId,
        action: { $in: SCHOOL_ACTIONS },
      },
      query
    );
  },

  async getApprovalTimeline(schoolId) {
    const school = await schoolService.getSchool(schoolId);
    const history = await reportRepository.getApprovalHistory('School', schoolId);
    return { school, timeline: history };
  },
};

module.exports = schoolApprovalService;
