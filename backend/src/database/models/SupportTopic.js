const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const supportTopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  audience: {
    type: String,
    enum: ['parent', 'school', 'vendor', 'general'],
    required: true
  },
  displayOrder: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'supportTopics' });

// Plugins
supportTopicSchema.plugin(auditPlugin);

// Indexes
// slug is unique
supportTopicSchema.index({ audience: 1, status: 1, displayOrder: 1 });

module.exports = mongoose.model('SupportTopic', supportTopicSchema);
