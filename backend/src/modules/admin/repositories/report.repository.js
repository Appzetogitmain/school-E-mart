const AuditLog = require('../../../database/models/AuditLog');
const { executePaginatedQuery } = require('../../../repositories/query');

const reportRepository = {
  paginateAuditLogs(filter, queryString, options = {}) {
    const merged = { ...filter };
    if (queryString.from || queryString.to) {
      merged.at = {};
      if (queryString.from) merged.at.$gte = new Date(queryString.from);
      if (queryString.to) merged.at.$lte = new Date(queryString.to);
    }
    if (queryString.action) merged.action = queryString.action;
    if (queryString.entityType) merged.entityType = queryString.entityType;
    return executePaginatedQuery(AuditLog, merged, queryString, {
      defaultSort: '-at',
      ...options,
    });
  },

  getApprovalHistory(entityType, entityId, limit = 50) {
    return AuditLog.find({ entityType, entityId })
      .sort({ at: -1 })
      .limit(limit)
      .lean();
  },
};

module.exports = reportRepository;
