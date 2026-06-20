const mongoose = require('mongoose');

const orderTrackingEventSchema = new mongoose.Schema({
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderShipment', required: true },
  at: { type: Date, required: true, default: Date.now },
  status: { type: String, required: true },
  location: {
    type: { type: String, enum: ['Point'] },
    coordinates: { type: [Number] }
  },
  notes: { type: String },
  actorRole: { type: String },
  actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { collection: 'orderTrackingEvents', timestamps: false });

// Indexes
orderTrackingEventSchema.index({ shipmentId: 1, at: 1 });

module.exports = mongoose.model('OrderTrackingEvent', orderTrackingEventSchema);
