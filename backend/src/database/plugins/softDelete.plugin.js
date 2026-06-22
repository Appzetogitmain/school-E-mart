const mongoose = require('mongoose');

/**
 * Soft Delete Plugin for Mongoose
 * Adds standard soft delete fields and filters out deleted documents by default.
 */
module.exports = function softDeletePlugin(schema, options) {
  schema.add({
    softDelete: {
      isDeleted: { type: Boolean, default: false },
      deletedAt: { type: Date, default: null },
      deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
      reason: { type: String, default: null },
      originalRefId: { type: String, default: null }
    }
  });

  // Exclude soft-deleted docs from standard queries unless options.includeDeleted is true
  const queryHooks = ['find', 'findOne', 'findOneAndUpdate', 'update', 'updateOne', 'updateMany', 'count', 'countDocuments'];
  
  queryHooks.forEach((hook) => {
    schema.pre(hook, function excludeSoftDeleted() {
      if (this.options && this.options.includeDeleted === true) {
        return;
      }
      this.where({ 'softDelete.isDeleted': { $ne: true } });
    });
  });

  // Add a markAsDeleted method to the document
  schema.methods.markAsDeleted = async function (deletedBy = null, reason = null) {
    this.softDelete.isDeleted = true;
    this.softDelete.deletedAt = new Date();
    this.softDelete.deletedBy = deletedBy;
    this.softDelete.reason = reason;
    return this.save();
  };

  // Add a restore method
  schema.methods.restore = async function () {
    this.softDelete.isDeleted = false;
    this.softDelete.deletedAt = null;
    this.softDelete.deletedBy = null;
    this.softDelete.reason = null;
    return this.save();
  };
};
