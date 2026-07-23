const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const phonebookEntrySchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  name: { type: String, required: true },
  // Optional label/role (e.g. "Ambulance", "Front Office"). Emergency numbers
  // only need a name + phone, so this is not required.
  designation: { type: String },
  department: { type: String },
  // Groups the entry in the phonebook UI. 'emergency' surfaces in its own
  // section on the parent app; other values are shown as general contacts.
  category: {
    type: String,
    enum: ['general', 'emergency', 'transport', 'medical', 'other'],
    default: 'general'
  },
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
