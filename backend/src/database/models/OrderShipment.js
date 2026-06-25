const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const orderShipmentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'VendorProfile', required: true },
  items: [{
    orderItemIndex: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 }
  }],
  courier: { type: String },
  awbNumber: { type: String },
  shiprocketOrderId: { type: String, index: true },
  shiprocketShipmentId: { type: String, index: true },
  awbCode: { type: String, index: true },
  courierName: { type: String },
  trackingUrl: { type: String },
  labelUrl: { type: String },
  pickupScheduled: { type: Boolean, default: false },
  pickupScheduledAt: { type: Date },
  shipmentCreatedAt: { type: Date },
  shipmentCancelledAt: { type: Date },
  currentStatus: { type: String },
  webhookLogs: [{ type: mongoose.Schema.Types.Mixed }],
  lastWebhookAt: { type: Date },
  failureReason: { type: String },
  retryCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['placed', 'accepted', 'processed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled', 'returned'],
    required: true,
    default: 'placed'
  },
  lastLocation: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },
  etaAt: { type: Date }
}, { collection: 'orderShipments', timestamps: false });

// Plugins
orderShipmentSchema.plugin(auditPlugin);

// Indexes
orderShipmentSchema.index({ orderId: 1 });
orderShipmentSchema.index({ vendorId: 1, status: 1, 'audit.createdAt': -1 });
orderShipmentSchema.index({ awbNumber: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('OrderShipment', orderShipmentSchema);
