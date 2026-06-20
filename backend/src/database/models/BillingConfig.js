const mongoose = require('mongoose');

const billingConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'default' },
  platformFeePaise: { type: Number, required: true },
  freeDeliveryThresholdPaise: { type: Number, required: true },
  pricingMode: { 
    type: String, 
    enum: ['fixed', 'distance'],
    required: true
  },
  fixedDeliveryChargePaise: { type: Number, required: true },
  baseChargePaise: { type: Number, required: true },
  baseDistanceKm: { type: mongoose.Schema.Types.Decimal128, required: true },
  extraKmChargePaise: { type: Number, required: true },
  riderCommissionPercent: { type: mongoose.Schema.Types.Decimal128, required: true },
  updatedBy: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, required: true, default: Date.now }
}, { collection: 'billingConfig', timestamps: false });

module.exports = mongoose.model('BillingConfig', billingConfigSchema);
