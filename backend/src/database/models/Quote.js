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
  // What the vendor wants paid up front before they'll fulfil the order, as a
  // percentage of totalPaise. The school sees this — and the rupee amount it
  // works out to — before ever awarding the quote, per the RFQ's own terms.
  advancePercent: { type: Number, required: true, min: 0, max: 100 },
  // Snapshotted at submission time so the figure the school saw and awarded
  // against never drifts even if totalPaise's derivation logic ever changes.
  advanceAmountPaise: { type: Number, required: true, min: 0 },
  termsAndConditions: { type: String },
  deliveryTimeline: { type: String }, // Free-text fulfilment timeline provided by vendor
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
