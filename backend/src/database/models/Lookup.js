const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const lookupSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'grade', 'section', 'subject', 'academic_year',
      'event_type', 'event_category', 'homework_type', 'city_pincode'
    ],
    required: true
  },
  code: { type: String, required: true },
  label: { type: String, required: true },
  group: { type: String },
  displayOrder: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'lookups' });

// Plugins
lookupSchema.plugin(auditPlugin);

// Indexes
lookupSchema.index({ type: 1, code: 1 }, { unique: true });
lookupSchema.index({ type: 1, status: 1, displayOrder: 1 });

module.exports = mongoose.model('Lookup', lookupSchema);
