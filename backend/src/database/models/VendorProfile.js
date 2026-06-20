const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const vendorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  storeName: { type: String, required: true, maxlength: 80 },
  storeSlug: { type: String, required: true, unique: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HeaderCategory' }],
  commissionPercent: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0, max: 100 },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    required: true,
    default: 'pending'
  },
  address: {
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pinCode: { type: String, required: true }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  serviceRadiusKm: { type: Number, required: true, min: 0 },
  gstin: { 
    type: String,
    match: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z][Z][0-9A-Z]$/
  },
  panCard: { 
    type: String,
    match: /^[A-Z]{5}[0-9]{4}[A-Z]$/
  },
  bank: {
    accountName: { type: String },
    bankName: { type: String },
    branch: { type: String },
    accountNumberEnc: { type: String },
    ifsc: { 
      type: String,
      match: /^[A-Z]{4}0[A-Z0-9]{6}$/
    }
  },
  kycDocs: [{
    type: { type: String },
    attachmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }
  }],
  rating: { type: mongoose.Schema.Types.Decimal128, min: 0, max: 5 },
  ordersCount: { type: Number, required: true, default: 0 },
  verifiedBadge: { type: Boolean, required: true, default: false }
}, { collection: 'vendorProfiles' });

// Plugins
vendorProfileSchema.plugin(auditPlugin);
vendorProfileSchema.plugin(softDeletePlugin);

// Indexes
// userId, storeSlug are already unique
// Soft delete compound index
vendorProfileSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('VendorProfile', vendorProfileSchema);
