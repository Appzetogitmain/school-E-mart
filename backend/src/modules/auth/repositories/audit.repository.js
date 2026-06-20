const AuditLog = require('../../../database/models/AuditLog');

const auditRepository = {
  log({
    actorUserId = null,
    actorRole = null,
    action,
    entityType,
    entityId,
    before = null,
    after = null,
    ipAddress = null,
    userAgent = null,
    correlationId = null,
  }) {
    return AuditLog.create({
      actorUserId,
      actorRole,
      action,
      entityType,
      entityId,
      before,
      after,
      ipAddress,
      userAgent,
      correlationId,
      at: new Date(),
    });
  },
};

module.exports = auditRepository;
