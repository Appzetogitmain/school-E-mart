const User = require('../../../database/models/User');
const { BaseRepository } = require('../../../repositories');
const { executePaginatedQuery } = require('../../../repositories/query');

class AdminUserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  paginateUsers(filter = {}, queryString = {}, options = {}) {
    const merged = this.mergeFilter(filter);
    if (queryString.search || queryString.q) {
      const term = queryString.search || queryString.q;
      merged.$or = [
        { name: { $regex: term, $options: 'i' } },
        { email: { $regex: term, $options: 'i' } },
        { phone: { $regex: term, $options: 'i' } },
        { refId: { $regex: term, $options: 'i' } },
      ];
    }
    if (queryString.role) merged.role = queryString.role;
    if (queryString.status) merged.status = queryString.status;
    if (queryString.from || queryString.to) {
      merged['audit.createdAt'] = {};
      if (queryString.from) merged['audit.createdAt'].$gte = new Date(queryString.from);
      if (queryString.to) merged['audit.createdAt'].$lte = new Date(queryString.to);
    }
    return executePaginatedQuery(User, merged, queryString, {
      defaultSort: '-audit.createdAt',
      ...options,
    });
  }

  updateStatus(userId, status) {
    return this.updateById(userId, { $set: { status } });
  }

  updateRole(userId, role, roleScopes = []) {
    return this.updateById(userId, { $set: { role, roleScopes } });
  }

  countByRole() {
    return User.aggregate([
      { $match: this.activeFilter },
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
  }

  countByStatus() {
    return User.aggregate([
      { $match: this.activeFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
  }

  getRecentRegistrations(limit = 10) {
    return User.find(this.activeFilter)
      .sort({ 'audit.createdAt': -1 })
      .limit(limit)
      .select('refId name email phone role status audit.createdAt')
      .lean();
  }
}

module.exports = new AdminUserRepository();
