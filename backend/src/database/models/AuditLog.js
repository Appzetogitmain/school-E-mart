const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  actorUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  actorRole: { type: String },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  before: { type: mongoose.Schema.Types.Mixed },
  after: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  at: { type: Date, required: true, default: Date.now },
  correlationId: { type: String }
}, { collection: 'auditLogs', timestamps: false });

// Indexes
auditLogSchema.index({ entityType: 1, entityId: 1, at: -1 });
auditLogSchema.index({ actorUserId: 1, at: -1 });
auditLogSchema.index({ at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
