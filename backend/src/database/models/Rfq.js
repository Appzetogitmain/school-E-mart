const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const rfqSchema = new mongoose.Schema({
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
  rfqNumber: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  items: [{
    name: { type: String, required: true },
    specifications: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    uom: { type: String, required: true } // Unit of Measure
  }],
  targetDeliveryDate: { type: Date },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  status: {
    type: String,
    enum: ['draft', 'open', 'reviewing', 'awarded', 'closed', 'cancelled'],
    required: true,
    default: 'draft'
  },
  invitedVendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' }]
}, { collection: 'rfqs' });

// Plugins
rfqSchema.plugin(auditPlugin);
rfqSchema.plugin(softDeletePlugin);

// Indexes
// rfqNumber is unique
rfqSchema.index({ schoolId: 1, status: 1, 'audit.createdAt': -1 });
rfqSchema.index({ invitedVendorIds: 1, status: 1 });
// Soft delete compound index
rfqSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Rfq', rfqSchema);
