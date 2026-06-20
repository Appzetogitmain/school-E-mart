const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const vendorLeadSchema = new mongoose.Schema({
  storeName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  email: { type: String },
  phone: { type: String, required: true },
  city: { type: String },
  categories: [{ type: String }],
  source: { type: String }, // 'website_form', 'referral', 'sales_team'
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['new', 'contacted', 'interested', 'not_interested', 'converted'],
    required: true,
    default: 'new'
  },
  notes: [{
    text: { type: String, required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now }
  }]
}, { collection: 'vendorLeads' });

// Plugins
vendorLeadSchema.plugin(auditPlugin);
vendorLeadSchema.plugin(softDeletePlugin);

// Indexes
vendorLeadSchema.index({ status: 1, 'audit.createdAt': -1 });
vendorLeadSchema.index({ assignedTo: 1, status: 1 });
// Soft delete compound index
vendorLeadSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('VendorLead', vendorLeadSchema);
