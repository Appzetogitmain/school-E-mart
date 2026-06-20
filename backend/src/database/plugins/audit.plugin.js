const mongoose = require('mongoose');

/**
 * Audit Plugin for Mongoose
 * Adds standard audit fields and versioning to the schema.
 */
module.exports = function auditPlugin(schema, options) {
  schema.add({
    audit: {
      createdAt: { type: Date, default: Date.now },
      createdBy: { type: mongoose.Schema.Types.Mixed, default: 'system' }, // ObjectId or string 'system'
      updatedAt: { type: Date, default: Date.now },
      updatedBy: { type: mongoose.Schema.Types.Mixed, default: 'system' },
      version: { type: Number, default: 1 },
      source: { type: String, enum: ['web', 'app', 'admin', 'webhook', 'cron', 'system'], default: 'system' },
      correlationId: { type: String }
    }
  });

  // Pre-save hook to update timestamps and version
  schema.pre('save', function (next) {
    if (this.isNew) {
      this.audit.createdAt = this.audit.createdAt || new Date();
      this.audit.version = 1;
    } else {
      this.audit.updatedAt = new Date();
      if (this.isModified()) {
        this.audit.version = (this.audit.version || 0) + 1;
      }
    }
    next();
  });

  // Update hooks (findOneAndUpdate, updateOne, updateMany)
  const updateHooks = ['findOneAndUpdate', 'updateOne', 'updateMany'];
  updateHooks.forEach(hook => {
    schema.pre(hook, function (next) {
      const update = this.getUpdate();
      if (update && !update.$set) update.$set = {};
      if (update && !update.$inc) update.$inc = {};
      
      update.$set['audit.updatedAt'] = new Date();
      update.$inc['audit.version'] = 1;
      next();
    });
  });
};
