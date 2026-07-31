const mongoose = require('mongoose');

const deliveryShipmentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, index: true },
    orderMongoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    deliveryProvider: { type: String, enum: ['shiprocket', 'manual'], default: 'shiprocket' },
    shiprocketOrderId: { type: String, index: true },

    shiprocketShipmentId: { type: String, index: true },
    awbCode: { type: String, unique: true, sparse: true },
    courierName: { type: String },
    trackingUrl: { type: String },
    labelUrl: { type: String },
    status: {
      type: String,
      enum: [
        'pending',
        'created',
        'pickup_scheduled',
        'in_transit',
        'out_for_delivery',
        'delivered',
        'cancelled',
        'failed',
      ],
      default: 'pending',
    },
    currentStatus: { type: String },
    timeline: [
      {
        status: { type: String },
        timestamp: { type: Date },
        location: { type: String },
        raw: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    etaTimestamp: { type: Date },
    pickupScheduled: { type: Boolean, default: false },
    pickupScheduledAt: { type: Date },
    webhookLog: [
      {
        receivedAt: { type: Date },
        payload: { type: mongoose.Schema.Types.Mixed },
        processed: { type: Boolean, default: false },
      },
    ],
    idempotencyKey: { type: String, unique: true, sparse: true },
    failureReason: { type: String },
    retryCount: { type: Number, default: 0 },
  },
  { collection: 'deliveryShipments', timestamps: true }
);

module.exports = mongoose.model('DeliveryShipment', deliveryShipmentSchema);
