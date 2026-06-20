const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const vendorAnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    required: true,
    default: 'normal'
  },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  targetVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' }], // If empty, visible to all vendors
  validFrom: { type: Date, required: true, default: Date.now },
  validUntil: { type: Date },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    required: true,
    default: 'draft'
  }
}, { collection: 'vendorAnnouncements' });

// Plugins
vendorAnnouncementSchema.plugin(auditPlugin);
vendorAnnouncementSchema.plugin(softDeletePlugin);

// Indexes
vendorAnnouncementSchema.index({ status: 1, validFrom: 1, validUntil: 1, priority: 1 });
// Soft delete compound index
vendorAnnouncementSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('VendorAnnouncement', vendorAnnouncementSchema);
