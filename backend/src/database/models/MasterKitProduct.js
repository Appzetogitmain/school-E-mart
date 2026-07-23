const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const masterKitProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  subcategory: { type: String, trim: true },
  imageUrl: { type: String },
  productType: {
    type: String,
    enum: ['uniform', 'textbook', 'notebook', 'stationary', 'winter', 'project', 'general'],
    default: 'general'
  },
  description: { type: String },
  supportedAttributes: {
    hasColor: { type: Boolean, default: false },
    hasSize: { type: Boolean, default: false },
    hasGender: { type: Boolean, default: false },
    hasPublisher: { type: Boolean, default: false },
    hasSubject: { type: Boolean, default: false },
  }
}, { collection: 'masterKitProducts' });

masterKitProductSchema.plugin(auditPlugin);
masterKitProductSchema.plugin(softDeletePlugin);

masterKitProductSchema.index({ category: 1, subcategory: 1 });
masterKitProductSchema.index({ name: 'text' });
masterKitProductSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('MasterKitProduct', masterKitProductSchema);
