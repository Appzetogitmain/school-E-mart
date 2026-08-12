const mongoose = require('mongoose');
const auditPlugin = require('../plugins/audit.plugin');

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  audience: {
    type: String,
    enum: ['parent', 'school'],
    required: true
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductVariant' },
    name: { type: String, required: true },
    image: { type: String },
    sku: { type: String, required: true },
    pricePaise: { type: Number, required: true, min: 0 },
    mrpPaise: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String },
    weightGrams: { type: Number },
    // Only present when productId is a Kit: the parent's chosen size/color for
    // each kit item that offers a choice, positionally matched to Kit.items by
    // index. Re-validated against the live kit again at checkout (see
    // checkout.service.js) since the kit can change between add-to-cart and
    // placing the order.
    kitSelections: [{
      itemIndex: { type: Number, required: true },
      name: { type: String },
      size: { type: String },
      color: { type: String },
      _id: false
    }]
  }],
  subtotalPaise: { type: Number, required: true, default: 0, min: 0 },
  taxPaise: { type: Number, required: true, default: 0, min: 0 },
  discountPaise: { type: Number, required: true, default: 0, min: 0 },
  totalPaise: { type: Number, required: true, default: 0, min: 0 },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }
}, { collection: 'carts', timestamps: false });

// Plugins
cartSchema.plugin(auditPlugin);

// Indexes
// One active cart per user per audience
cartSchema.index({ userId: 1, audience: 1 }, { unique: true });

module.exports = mongoose.model('Cart', cartSchema);
