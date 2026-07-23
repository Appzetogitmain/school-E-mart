const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const schoolKitCategorySchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true, trim: true }
}, { collection: 'schoolKitCategories' });

schoolKitCategorySchema.plugin(auditPlugin);
schoolKitCategorySchema.plugin(softDeletePlugin);

schoolKitCategorySchema.index({ schoolId: 1, name: 1 }, { unique: true });
schoolKitCategorySchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('SchoolKitCategory', schoolKitCategorySchema);
