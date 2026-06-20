const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  audience: {
    type: String,
    enum: ['all', 'parent', 'school', 'vendor'],
    required: true,
    default: 'all'
  },
  displayOrder: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'faqs' });

// Plugins
faqSchema.plugin(auditPlugin);

// Indexes
faqSchema.index({ audience: 1, category: 1, status: 1, displayOrder: 1 });

module.exports = mongoose.model('Faq', faqSchema);
