const { NotFoundError, BadRequestError } = require('../../../common/errors');
const schoolRepository = require('../../school/repositories/school.repository');
const schoolService = require('../../school/services/school.service');
const schoolAdminRegistrationService = require('../../school/services/schoolAdminRegistration.service');
const auditRepository = require('../../auth/repositories/audit.repository');
const reportRepository = require('../repositories/report.repository');
const logger = require('../../../common/logger');
const emailService = require('../../../common/email');
const User = require('../../../database/models/User');
const { runAtomic } = require('../../orders/utils/atomic');
const { mapSchoolDisplayStatus } = require('../../school/utils/status');

const SCHOOL_ACTIONS = ['school.approved', 'school.rejected', 'school.suspended', 'school.reactivated'];

/** The admin User owns the contact details and the status that distinguishes rejected from pending. */
const findAdminUser = (schoolId) =>
  User.findOne({ tenantSchoolId: schoolId, role: 'school' })
    .sort({ 'audit.createdAt': 1 })
    .lean();

/**
 * Resolves each school's admin user in one query and folds in the computed
 * display status plus the contact fields the admin table needs. Without this the
 * list has no phone number and cannot tell a rejected school from a pending one.
 */
const decorateSchools = async (schools) => {
  if (!schools.length) return schools;

  const ids = schools.map((s) => s._id).filter(Boolean);
  const admins = await User.find({ tenantSchoolId: { $in: ids }, role: 'school' })
    .sort({ 'audit.createdAt': 1 })
    .lean();

  // First admin per school wins, matching findAdminUser's ordering.
  const bySchool = new Map();
  admins.forEach((admin) => {
    const key = String(admin.tenantSchoolId);
    if (!bySchool.has(key)) bySchool.set(key, admin);
  });

  return schools.map((school) => {
    const admin = bySchool.get(String(school._id)) || {};
    return {
      ...school,
      status: mapSchoolDisplayStatus(school, admin),
      adminName: admin.name || null,
      adminPhone: admin.phone || null,
      adminEmail: school.adminEmail || admin.email || null,
      adminUserStatus: admin.status || null,
    };
  });
};

/**
 * 'pending' and 'rejected' are both partnerStatus 'prospect' — they differ only by
 * the admin user's status, which lives in another collection. Narrow by school id
 * first so the difference can be expressed as an ordinary School filter.
 */
const applyDisplayStatusFilter = async (filter, status) => {
  if (status === 'active' || status === 'suspended') {
    return { ...filter, partnerStatus: status };
  }
  if (status !== 'pending' && status !== 'rejected') return filter;

  const admins = await User.find({ role: 'school', status: 'inactive' }, { tenantSchoolId: 1 }).lean();
  const rejectedIds = admins.map((a) => a.tenantSchoolId).filter(Boolean);

  return {
    ...filter,
    partnerStatus: 'prospect',
    _id: status === 'rejected' ? { $in: rejectedIds } : { $nin: rejectedIds },
  };
};

const buildSearchFilter = (query) => {
  const filter = {};
  if (query.search || query.q) {
    const term = query.search || query.q;
    filter.$or = [
      { name: { $regex: term, $options: 'i' } },
      { code: { $regex: term, $options: 'i' } },
      { schoolRefNo: { $regex: term, $options: 'i' } },
      { adminEmail: { $regex: term, $options: 'i' } },
    ];
  }
  return filter;
};

/**
 * ApiFeatures turns every unrecognised query param into a Mongo filter, so
 * forwarding these would add e.g. `{ status: 'all' }` to a School query — and
 * School has no `status` field, so it matched nothing. They are all handled
 * explicitly above; drop them before the repository sees them.
 */
const HANDLED_PARAMS = ['status', 'partnerStatus', 'q', 'search'];

const paginationOnly = (query = {}) => {
  const rest = { ...query };
  HANDLED_PARAMS.forEach((key) => delete rest[key]);
  return rest;
};

const schoolApprovalService = {
  async listPendingSchools(query) {
    const filter = await applyDisplayStatusFilter(buildSearchFilter(query), 'pending');
    const result = await schoolRepository.paginateSchools(filter, paginationOnly(query));
    return { ...result, data: await decorateSchools(result.data) };
  },

  async listSchools(query) {
    let filter = buildSearchFilter(query);

    // `status` is the computed display status; `partnerStatus` is the raw stored
    // value. Support both so existing callers keep working.
    if (query.status && query.status !== 'all') {
      filter = await applyDisplayStatusFilter(filter, query.status);
    } else if (query.partnerStatus) {
      filter.partnerStatus = query.partnerStatus;
    }

    const result = await schoolRepository.paginateSchools(filter, paginationOnly(query));
    return { ...result, data: await decorateSchools(result.data) };
  },

  async getSchool(schoolId) {
    const school = await schoolService.getSchool(schoolId);
    if (!school) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    const [decorated] = await decorateSchools([school]);
    return decorated;
  },

  // Master-admin-only. Schools cannot set their own commission — only this
  // superadmin path writes School.commission.
  async setCommission(schoolId, { kitPercent, retailPercent }, actor = {}) {
    const existing = await schoolService.getSchool(schoolId);
    if (!existing) throw new NotFoundError('School not found', 'SCHOOL_NOT_FOUND');
    const school = await schoolService.updateSchool(schoolId, {
      commission: { kitPercent, retailPercent },
    });
    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'school.commission.updated',
      entityType: 'School',
      entityId: schoolId,
      after: { commission: { kitPercent, retailPercent } },
    });
    return school;
  },

  /**
   * Admin-entered schools are created already approved — the admin doing the
   * entering is the reviewer, so routing them through 'prospect' would mean
   * approving one's own submission.
   */
  async createSchool(payload, actor = {}) {
    const { user, school, schoolRefNo } = await schoolAdminRegistrationService.createByAdmin(payload);

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'school.created',
      entityType: 'School',
      entityId: school._id,
      after: { schoolRefNo, adminUserId: user._id },
    });

    const [decorated] = await decorateSchools([school.toObject ? school.toObject() : school]);
    return decorated;
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

      // Login is gated on approval, so this mail is the school's only signal that
      // they can now sign in. Best-effort: a dead SMTP host must not roll back an
      // approval that already committed.
      const admin = await findAdminUser(schoolId);
      if (admin?.email) {
        try {
          await emailService.sendSchoolApprovedEmail({
            to: admin.email,
            name: admin.name,
            schoolName: updated?.name || school.name,
          });
        } catch (error) {
          logger.error('School approval email failed to send', { schoolId, error: error.message });
        }
      }

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
