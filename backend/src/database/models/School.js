const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const schoolSchema = new mongoose.Schema({
  code: { type: String, required: true },
  name: { type: String, required: true },
  principalName: { type: String },
  adminEmail: { type: String },
  schoolRefNo: { type: String, required: true },
  address: {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    pinCode: { type: String }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  partnerStatus: {
    type: String,
    enum: ['prospect', 'active', 'suspended'],
    required: true,
    default: 'prospect'
  },
  // Bank details for withdrawing kit-commission earnings. Account number is
  // stored one-way (HMAC) like the vendor side — set once, never read back.
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
  academicYearCurrent: { type: String },
  gradesOffered: [{ type: String }],
  sectionsConfig: [{
    class: { type: String },
    sections: [{ type: String }]
  }]
}, { collection: 'schools' });

// Plugins
schoolSchema.plugin(auditPlugin);
schoolSchema.plugin(softDeletePlugin);

// Indexes
schoolSchema.index({ code: 1 }, { unique: true });
schoolSchema.index({ schoolRefNo: 1 }, { unique: true });
schoolSchema.index({ name: 'text', code: 'text' });
schoolSchema.index({ location: '2dsphere' });
// Soft delete compound index
schoolSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('School', schoolSchema);
