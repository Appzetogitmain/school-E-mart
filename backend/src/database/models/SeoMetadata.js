const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const seoMetadataSchema = new mongoose.Schema({
  routePath: { type: String, required: true, unique: true }, // Exact URL path or pattern e.g. '/products/:slug'
  metaTitle: { type: String, required: true },
  metaDescription: { type: String, required: true },
  keywords: [{ type: String }],
  ogImage: { type: String },
  canonicalUrl: { type: String },
  noIndex: { type: Boolean, default: false }
}, { collection: 'seoMetadata' });

// Plugins
seoMetadataSchema.plugin(auditPlugin);

// Indexes
// routePath is unique

module.exports = mongoose.model('SeoMetadata', seoMetadataSchema);
