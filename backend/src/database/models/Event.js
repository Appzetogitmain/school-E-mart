const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const eventSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  title: { type: String, required: true },
  description: { type: String },
  eventType: { type: String, required: true }, // from Lookups
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  location: { type: String },
  targetAudience: {
    type: String,
    enum: ['all', 'parents', 'teachers', 'students', 'specific_classes'],
    required: true
  },
  targetClasses: [{
    classGrade: { type: String },
    sections: [{ type: String }]
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    required: true,
    default: 'upcoming'
  }
}, { collection: 'events' });

// Plugins
eventSchema.plugin(auditPlugin);
eventSchema.plugin(softDeletePlugin);

// Indexes
eventSchema.index({ schoolId: 1, startDate: 1, status: 1 });
// Soft delete compound index
eventSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Event', eventSchema);
