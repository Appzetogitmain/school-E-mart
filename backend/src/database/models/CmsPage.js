const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const cmsPageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, required: true }, // HTML or Markdown
  seo: {
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }]
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft'
  }
}, { collection: 'cmsPages' });

// Plugins
cmsPageSchema.plugin(auditPlugin);
cmsPageSchema.plugin(softDeletePlugin);

// Indexes
// slug is unique
cmsPageSchema.index({ status: 1 });
// Soft delete compound index
cmsPageSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('CmsPage', cmsPageSchema);
