const mongoose = require('mongoose');

const billingConfigSchema = new mongoose.Schema({
  _id: { type: String, default: 'default' },
  platformFeePaise: { type: Number, required: true },
  freeDeliveryThresholdPaise: { type: Number, required: true },
  fixedDeliveryChargePaise: { type: Number, required: true },
  schoolDeliveryFreeDays: { type: Number, default: 7 },
  schoolDeliveryChargePaise: { type: Number, default: 4900 },
  updatedBy: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedAt: { type: Date, required: true, default: Date.now }
}, { collection: 'billingConfig', timestamps: false });

module.exports = mongoose.model('BillingConfig', billingConfigSchema);
