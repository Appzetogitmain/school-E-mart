const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const quoteSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rfq', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', required: true },
  items: [{
    rfqItemIndex: { type: Number, required: true },
    unitPricePaise: { type: Number, required: true, min: 0 },
    taxRatePercent: { type: mongoose.Schema.Types.Decimal128, required: true },
    lineTotalPaise: { type: Number, required: true, min: 0 },
    remarks: { type: String }
  }],
  subtotalPaise: { type: Number, required: true, min: 0 },
  taxPaise: { type: Number, required: true, min: 0 },
  totalPaise: { type: Number, required: true, min: 0 },
  termsAndConditions: { type: String },
  validUntil: { type: Date, required: true },
  attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],
  status: {
    type: String,
    enum: ['submitted', 'shortlisted', 'accepted', 'rejected', 'withdrawn'],
    required: true,
    default: 'submitted'
  }
}, { collection: 'quotes' });

// Plugins
quoteSchema.plugin(auditPlugin);
quoteSchema.plugin(softDeletePlugin);

// Indexes
quoteSchema.index({ rfqId: 1, vendorId: 1 }, { unique: true });
quoteSchema.index({ rfqId: 1, status: 1, totalPaise: 1 });
quoteSchema.index({ vendorId: 1, status: 1, 'audit.createdAt': -1 });
// Soft delete compound index
quoteSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Quote', quoteSchema);
