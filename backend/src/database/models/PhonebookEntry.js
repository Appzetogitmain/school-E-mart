const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const phonebookEntrySchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  designation: { type: String, required: true },
  department: { type: String },
  email: { type: String },
  phone: { type: String, required: true },
  availabilityHours: { type: String },
  displayOrder: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'phonebookEntries' });

// Plugins
phonebookEntrySchema.plugin(auditPlugin);
phonebookEntrySchema.plugin(softDeletePlugin);

// Indexes
phonebookEntrySchema.index({ schoolId: 1, status: 1, displayOrder: 1 });
// Soft delete compound index
phonebookEntrySchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('PhonebookEntry', phonebookEntrySchema);
