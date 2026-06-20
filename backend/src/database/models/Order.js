const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');
const softDeletePlugin = require('../plugins/softDelete.plugin');

const orderSchema = new mongoose.Schema({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    match: /^(ORD\d{10,}|PROC-\d{4,})$/
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audience: {
    type: String,
    enum: ['parent', 'school'],
    required: true
  },
  schoolIdForPickup: { type: mongoose.Schema.Types.ObjectId, ref: 'School' },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', required: true },
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
    pricePaise: { type: Number, required: true, min: 0 },
    mrpPaise: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String },
    taxRatePercent: { type: mongoose.Schema.Types.Decimal128 },
    taxPaise: { type: Number, required: true, min: 0 },
    lineTotalPaise: { type: Number, required: true, min: 0 },
    fulfilmentStatus: { type: String }
  }],
  vendorIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile' }], // Distinct vendors in order
  subtotalPaise: { type: Number, required: true, min: 0 },
  taxPaise: { type: Number, required: true, min: 0 },
  discountPaise: { type: Number, required: true, min: 0, default: 0 },
  platformFeePaise: { type: Number, required: true, min: 0, default: 0 },
  deliveryChargePaise: { type: Number, required: true, min: 0, default: 0 },
  handlingChargePaise: { type: Number, required: true, min: 0, default: 0 },
  totalPaise: { type: Number, required: true, min: 0 },
  address: { type: mongoose.Schema.Types.Mixed, required: true }, // Embedded snapshot
  gstin: { type: String },
  deliveryType: {
    type: String,
    enum: ['home', 'school'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['online', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded'],
    required: true,
    default: 'pending'
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  orderStatus: {
    type: String,
    enum: ['placed', 'accepted', 'processed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    required: true,
    default: 'placed'
  },
  statusHistory: [{
    status: { type: String, required: true },
    at: { type: Date, required: true, default: Date.now },
    note: { type: String },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  cancellation: {
    at: { type: Date },
    reason: { type: String },
    byUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' } // Assuming refund is managed in payment
  },
  placedAt: { type: Date },
  acceptedAt: { type: Date },
  deliveredAt: { type: Date },
  invoiceUrl: { type: String }
}, { collection: 'orders' });

// Plugins
orderSchema.plugin(auditPlugin);
orderSchema.plugin(softDeletePlugin);

// Indexes
// orderNumber is unique
orderSchema.index({ userId: 1, 'audit.createdAt': -1 });
orderSchema.index({ vendorIds: 1, orderStatus: 1, 'audit.createdAt': -1 });
orderSchema.index({ orderStatus: 1, 'audit.createdAt': -1 });
orderSchema.index({ paymentStatus: 1, 'audit.createdAt': -1 });
orderSchema.index(
  { schoolIdForPickup: 1, 'audit.createdAt': -1 },
  { sparse: true }
);
orderSchema.index({ 'audit.createdAt': -1 });

// Soft delete compound index
orderSchema.index({ 'softDelete.isDeleted': 1, 'audit.updatedAt': -1 });

module.exports = mongoose.model('Order', orderSchema);
