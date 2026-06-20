const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const productVariantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  attributes: { 
    type: Map, 
    of: String,
    required: true
  },
  sku: { type: String, required: true, unique: true },
  pricePaise: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0 }
}, { collection: 'productVariants', timestamps: false });

// Plugins
productVariantSchema.plugin(auditPlugin);

// Indexes
productVariantSchema.index({ productId: 1 });

module.exports = mongoose.model('ProductVariant', productVariantSchema);
