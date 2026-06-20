const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  label: {
    type: String,
    enum: ['home', 'school', 'work', 'other'],
    required: true
  },
  recipientName: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String },
  landmark: { type: String },
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  pinCode: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },
  isDefault: { type: Boolean, required: true, default: false }
}, { collection: 'addresses' });

// Plugins
addressSchema.plugin(auditPlugin);
addressSchema.plugin(softDeletePlugin);

// Indexes
addressSchema.index({ userId: 1, isDefault: -1 });
addressSchema.index({ location: '2dsphere' });
// Soft delete compound index
addressSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Address', addressSchema);
