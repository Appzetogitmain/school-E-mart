const { NotFoundError, BadRequestError, ConflictError } = require('../../../common/errors');
const { ALL_ROLES } = require('../../../constants/roles');
const { normalizePhone } = require('../../../utils');
const adminUserRepository = require('../repositories/user.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const reportRepository = require('../repositories/report.repository');
const { getStateStore } = require('../../../common/stateStore');
const env = require('../../../config/env');
const { runAtomic } = require('../../orders/utils/atomic');
const { triggerService } = require('../../../services/notification');
const User = require('../../../database/models/User');
const ParentProfile = require('../../../database/models/ParentProfile');
const ChildProfile = require('../../../database/models/ChildProfile');
const Address = require('../../../database/models/Address');

const USER_LOCK_PREFIX = 'auth:user-lock:';

const userManagementService = {
  async listUsers(query) {
    const { data, pagination } = await adminUserRepository.paginateUsers({}, query);

    // Batch-join each parent's linked student(s) so the table can show who
    // the account actually belongs to — the parent's own `name` field is
    // often not what identifies the row to a school. Same $in + Map idiom
    // users.service.js#getProfile already uses for its School lookup.
    const parentUserIds = data.filter((u) => u.role === 'parent').map((u) => u._id);
    if (parentUserIds.length) {
      const children = await ChildProfile.find({
        parentUserId: { $in: parentUserIds },
        'softDelete.isDeleted': { $ne: true },
      })
        .select('parentUserId name grade')
        .sort({ 'audit.createdAt': 1 })
        .lean();

      const childrenByParent = new Map();
      for (const child of children) {
        const key = String(child.parentUserId);
        if (!childrenByParent.has(key)) childrenByParent.set(key, []);
        childrenByParent.get(key).push({ name: child.name, grade: child.grade });
      }

      return {
        data: data.map((user) =>
          user.role === 'parent'
            ? { ...user, children: childrenByParent.get(String(user._id)) || [] }
            : user
        ),
        pagination,
      };
    }

    return { data, pagination };
  },

  async getUser(userId) {
    const user = await adminUserRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    return user;
  },

  async suspendUser(userId, actor = {}, reason) {
    return runAtomic(async () => {
      const user = await adminUserRepository.updateStatus(userId, 'suspended');
      if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'user.suspended',
        entityType: 'User',
        entityId: userId,
        after: { reason },
      });

      triggerService.notifyUserAction(userId, {
        title: 'Account Suspended',
        body: reason || 'Your account has been suspended. Contact support for help.',
        type: 'system',
        route: '/login',
      });

      return user;
    });
  },

  async activateUser(userId, actor = {}) {
    return runAtomic(async () => {
      const user = await adminUserRepository.updateStatus(userId, 'active');
      if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

      await this._clearUserLock(userId);

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'user.activated',
        entityType: 'User',
        entityId: userId,
      });

      triggerService.notifyUserAction(userId, {
        title: 'Account Reactivated',
        body: 'Your account has been reactivated. You can log in again.',
        type: 'system',
        route: '/login',
      });

      return user;
    });
  },

  async lockUser(userId, actor = {}, reason) {
    return runAtomic(async () => {
      const user = await adminUserRepository.updateStatus(userId, 'inactive');
      if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

      const store = getStateStore();
      try {
        const lockUntil = Date.now() + env.LOGIN_LOCKOUT_MINUTES * 60_000 * 24;
        await store.setJson(
          `${USER_LOCK_PREFIX}${userId}`,
          { lockedUntil: lockUntil, reason },
          24 * 60 * 60
        );
      } catch {
        // State store may be unavailable in test or degraded environments
      }

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'user.locked',
        entityType: 'User',
        entityId: userId,
        after: { reason },
      });

      return user;
    });
  },

  async unlockUser(userId, actor = {}) {
    return runAtomic(async () => {
      const user = await adminUserRepository.findById(userId);
      if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

      const updated =
        user.status === 'inactive' ? await adminUserRepository.updateStatus(userId, 'active') : user;

      await this._clearUserLock(userId);

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'user.unlocked',
        entityType: 'User',
        entityId: userId,
      });

      return updated;
    });
  },

  async assignRoles(userId, { role, roleScopes = [] }, actor = {}) {
    if (!ALL_ROLES.includes(role)) {
      throw new BadRequestError('Invalid role', null, 'INVALID_ROLE');
    }

    return runAtomic(async () => {
      const existing = await adminUserRepository.findById(userId);
      if (!existing) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

      const user = await adminUserRepository.updateRole(userId, role, roleScopes);

      await auditRepository.log({
        actorUserId: actor.userId,
        actorRole: actor.role,
        action: 'user.role_assigned',
        entityType: 'User',
        entityId: userId,
        before: { role: existing.role, roleScopes: existing.roleScopes },
        after: { role, roleScopes },
      });

      return user;
    });
  },

  async updateRoles(userId, { roleScopes }, actor = {}) {
    const existing = await adminUserRepository.findById(userId);
    if (!existing) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    const user = await adminUserRepository.updateById(userId, { $set: { roleScopes } });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'user.roles_updated',
      entityType: 'User',
      entityId: userId,
      before: { roleScopes: existing.roleScopes },
      after: { roleScopes },
    });

    return user;
  },

  async getUserActivity(userId, query = {}) {
    const user = await adminUserRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    const { data, pagination } = await reportRepository.paginateAuditLogs(
      { $or: [{ actorUserId: userId }, { entityType: 'User', entityId: userId }] },
      query
    );

    return { user, activity: data, pagination };
  },

  // Name/email/phone edit for any role from the superadmin panel. Mirrors the
  // uniqueness checks users.service.js#updateProfile already applies.
  async updateUser(userId, payload = {}, actor = {}) {
    const user = await User.findOne({ _id: userId, 'softDelete.isDeleted': { $ne: true } });
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    const before = { name: user.name, email: user.email, phone: user.phone };

    if (payload.name !== undefined) user.name = payload.name;

    if (payload.email !== undefined) {
      const normEmail = payload.email ? payload.email.trim().toLowerCase() : '';
      if (normEmail) {
        const emailOwner = await User.findEmailOwner(normEmail, { excludeUserId: userId });
        if (emailOwner) {
          throw new ConflictError(`Email already belongs to another account (${emailOwner.name})`, 'EMAIL_EXISTS');
        }
      }
      user.email = normEmail || undefined;
    }

    if (payload.phone !== undefined) {
      const normPhone = normalizePhone(payload.phone);
      const existingPhone = await User.findOne({
        _id: { $ne: userId },
        phone: normPhone,
        'softDelete.isDeleted': { $ne: true },
      });
      if (existingPhone) {
        throw new ConflictError('A user with this phone number already exists', 'PHONE_EXISTS');
      }
      user.phone = normPhone;
    }

    await user.save();

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'user.updated_by_admin',
      entityType: 'User',
      entityId: userId,
      before,
      after: { name: user.name, email: user.email, phone: user.phone },
    });

    return user.toObject();
  },

  // Hard delete, per product decision: the account and its profile data
  // (ParentProfile, linked ChildProfile(s), saved Addresses) are permanently
  // removed. Orders are deliberately left untouched — they're financial
  // history, not roster data (same reasoning as School's cascade delete in
  // school.service.js#deleteSchool).
  async deleteUser(userId, actor = {}, reason) {
    const user = await User.findById(userId).lean();
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    const children = await ChildProfile.find({ parentUserId: userId }).select('_id').lean();
    const childIds = children.map((c) => c._id);
    const addresses = await Address.find({ userId }).select('_id').lean();
    const addressIds = addresses.map((a) => a._id);

    await runAtomic(async (session) => {
      if (childIds.length) {
        await ChildProfile.deleteMany({ _id: { $in: childIds } }).session(session);
      }
      if (addressIds.length) {
        await Address.deleteMany({ _id: { $in: addressIds } }).session(session);
      }
      await ParentProfile.deleteOne({ userId }).session(session);
      await User.deleteOne({ _id: userId }).session(session);
    });

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'user.deleted',
      entityType: 'User',
      entityId: userId,
      after: { reason, name: user.name, role: user.role, childrenRemoved: childIds.length },
    });

    return user;
  },

  async _clearUserLock(userId) {
    try {
      const store = getStateStore();
      await store.del(`${USER_LOCK_PREFIX}${userId}`);
    } catch {
      // State store may be unavailable in test or degraded environments
    }
  },
};

module.exports = userManagementService;
