const AuditLog = require('../../../database/models/AuditLog');

const inventoryHistoryRepository = {
  async logAdjustment({ actorUserId, actorRole, productId, before, after, note }) {
    return AuditLog.create({
      actorUserId,
      actorRole,
      action: 'vendor.inventory.adjusted',
      entityType: 'Product',
      entityId: productId,
      before,
      after: { ...after, note },
      at: new Date(),
    });
  },

  async findByProduct(productId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const filter = {
      entityType: 'Product',
      entityId: productId,
      action: 'vendor.inventory.adjusted',
    };
    const [data, total] = await Promise.all([
      AuditLog.find(filter).sort({ at: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  },
};

module.exports = inventoryHistoryRepository;
