const { NotFoundError, BadRequestError } = require('../../../common/errors');
const { ALL_ROLES } = require('../../../constants/roles');
const adminUserRepository = require('../repositories/user.repository');
const auditRepository = require('../../auth/repositories/audit.repository');
const reportRepository = require('../repositories/report.repository');
const { getStateStore } = require('../../../common/stateStore');
const env = require('../../../config/env');
const { runAtomic } = require('../../orders/utils/atomic');

const USER_LOCK_PREFIX = 'auth:user-lock:';

const userManagementService = {
  listUsers(query) {
    return adminUserRepository.paginateUsers({}, query);
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

  async deleteUser(userId, actor = {}, reason) {
    const user = await adminUserRepository.softDeleteById(userId, {
      deletedBy: actor.userId,
      reason,
    });
    if (!user) throw new NotFoundError('User not found', 'USER_NOT_FOUND');

    await auditRepository.log({
      actorUserId: actor.userId,
      actorRole: actor.role,
      action: 'user.deleted',
      entityType: 'User',
      entityId: userId,
      after: { reason },
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
