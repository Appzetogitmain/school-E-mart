const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  description: { type: String },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    required: true
  },
  discountValue: { type: Number, required: true, min: 0 },
  maxDiscountPaise: { type: Number, min: 0 }, // Useful for percentage
  minOrderValuePaise: { type: Number, default: 0, min: 0 },
  validFrom: { type: Date, required: true },
  validUntil: { type: Date, required: true },
  usageLimit: { type: Number, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    required: true,
    default: 'active'
  }
}, { collection: 'coupons', timestamps: false });

// Plugins
couponSchema.plugin(auditPlugin);
couponSchema.plugin(softDeletePlugin);

// Indexes
// code is unique
couponSchema.index({ status: 1, validFrom: 1, validUntil: 1 });
// Soft delete compound index
couponSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Coupon', couponSchema);
