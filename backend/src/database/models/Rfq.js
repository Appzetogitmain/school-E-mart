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
  // Optional descriptive fields captured by the school "create request" wizard.
  academicYear: { type: String },
  classes: [{ type: String }],
  totalStudents: { type: Number, min: 0 },
  quotationDeadline: { type: Date }, // Deadline for vendors to submit quotes
  meta: { type: mongoose.Schema.Types.Mixed }, // Rich uniform-set data for display
  publishedAt: { type: Date },
  awardedVendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' },
  awardedQuoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quote' },
  // The order created the moment the quote is awarded — the school's payment
  // (advance, then remainder) and fulfilment tracking all happen on this Order
  // from here on; the RFQ itself just keeps the reference for navigation.
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
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
