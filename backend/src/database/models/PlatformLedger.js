const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

// The platform's (admin's) commission earnings. One credit per settled order,
// tagged with where the money came from so admin reporting can attribute it.
const platformLedgerSchema = new mongoose.Schema({
  transactionType: {
    type: String,
    enum: ['commission_credit', 'adjustment'],
    required: true
  },
  amountPaise: { type: Number, required: true },
  reference: {
    kind: { type: String, required: true }, // 'Order', etc.
    id: { type: mongoose.Schema.Types.ObjectId, required: true }
  },
  source: {
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School' }
  },
  description: { type: String }
}, { collection: 'platformLedgers', timestamps: false });

platformLedgerSchema.plugin(auditPlugin);

platformLedgerSchema.index({ 'audit.createdAt': -1 });
platformLedgerSchema.index({ 'reference.kind': 1, 'reference.id': 1 });

module.exports = mongoose.model('PlatformLedger', platformLedgerSchema);
