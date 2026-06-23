const { BadRequestError } = require('../../../common/errors');
const cartService = require('../../marketplace/services/cart.service');
const productRepository = require('../../marketplace/repositories/product.repository');
const variantRepository = require('../../marketplace/repositories/variant.repository');
const orderAccessPolicy = require('../policies/orderAccess.policy');

const DEFAULT_DELIVERY_CHARGE_PAISE = 0;
const DEFAULT_PLATFORM_FEE_PAISE = 0;
const DEFAULT_HANDLING_CHARGE_PAISE = 0;

const checkoutService = {
  resolveAudience(auth, requestedAudience) {
    const roleAudience = orderAccessPolicy.resolveAudience(auth);
    return roleAudience || requestedAudience || 'parent';
  },

  async buildLineItems(cartItems) {
    const lineItems = [];
    for (const item of cartItems) {
      const product = await productRepository.findOne(
        productRepository.findPublishedFilter({ _id: item.productId })
      );
      if (!product) {
        throw new BadRequestError(`Product unavailable: ${item.productId}`, null, 'CART_ITEM_INVALID');
      }

      let stock = product.stock;
      let pricePaise = product.pricePaise;
      let sku = product.sku;
      if (item.variantId) {
        const variant = await variantRepository.findOne({ _id: item.variantId, productId: item.productId });
        if (!variant) throw new BadRequestError('Variant not found', null, 'CART_VARIANT_INVALID');
        stock = variant.stock;
        pricePaise = variant.pricePaise;
        sku = variant.sku;
      }

      if (stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${product.name}`, null, 'INSUFFICIENT_STOCK');
      }
      if (item.pricePaise !== pricePaise) {
        throw new BadRequestError('Cart item price is outdated', null, 'CART_PRICE_STALE');
      }

      const taxRate = Number(product.taxRatePercent) || 0;
      const lineSubtotal = pricePaise * item.quantity;
      const taxPaise = Math.round((lineSubtotal * taxRate) / 100);

      lineItems.push({
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        sku,
        image: product.images?.[0]?.alt || item.image,
        variantId: item.variantId,
        pricePaise,
        mrpPaise: product.originalPricePaise || pricePaise,
        quantity: item.quantity,
        size: item.size,
        taxRatePercent: taxRate,
        taxPaise,
        lineTotalPaise: lineSubtotal + taxPaise,
        availableStock: stock,
      });
    }
    return lineItems;
  },

  computeOrderTotals(lineItems, options = {}) {
    const subtotalPaise = lineItems.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
    const taxPaise = lineItems.reduce((sum, item) => sum + item.taxPaise, 0);
    const discountPaise = lineItems.reduce(
      (sum, item) => sum + Math.max(0, (item.mrpPaise - item.pricePaise) * item.quantity),
      0
    );
    const deliveryChargePaise = options.deliveryChargePaise ?? DEFAULT_DELIVERY_CHARGE_PAISE;
    const platformFeePaise = options.platformFeePaise ?? DEFAULT_PLATFORM_FEE_PAISE;
    const handlingChargePaise = options.handlingChargePaise ?? DEFAULT_HANDLING_CHARGE_PAISE;
    const totalPaise =
      subtotalPaise + taxPaise + deliveryChargePaise + platformFeePaise + handlingChargePaise;

    return {
      subtotalPaise,
      taxPaise,
      discountPaise,
      deliveryChargePaise,
      platformFeePaise,
      handlingChargePaise,
      totalPaise,
    };
  },

  validateShipping({ address, deliveryType, schoolIdForPickup }) {
    if (!address?.line1 || !address?.city || !address?.pinCode) {
      throw new BadRequestError('Complete shipping address is required', null, 'ADDRESS_REQUIRED');
    }
    if (deliveryType === 'school' && !schoolIdForPickup) {
      throw new BadRequestError('School pickup requires schoolIdForPickup', null, 'SCHOOL_PICKUP_REQUIRED');
    }
  },

  async validateCheckout(userId, audience, payload = {}) {
    const cart = await cartService.getOrCreateCart(userId, audience);
    if (!cart.items?.length) {
      throw new BadRequestError('Cart is empty', null, 'CART_EMPTY');
    }
    await cartService.validateCartItems(cart.items);
    const lineItems = await this.buildLineItems(cart.items);
    if (payload.address || payload.deliveryType) {
      this.validateShipping({
        address: payload.address,
        deliveryType: payload.deliveryType || 'home',
        schoolIdForPickup: payload.schoolIdForPickup,
      });
    }
    return { cart, lineItems, valid: true };
  },

  async getOrderSummary(userId, audience, payload = {}) {
    const { cart, lineItems } = await this.validateCheckout(userId, audience, payload);
    const totals = this.computeOrderTotals(lineItems, payload);
    const vendorIds = [...new Set(lineItems.map((item) => String(item.vendorId)))];

    return {
      audience,
      itemCount: lineItems.reduce((sum, item) => sum + item.quantity, 0),
      items: lineItems,
      vendorCount: vendorIds.length,
      ...totals,
      deliveryType: payload.deliveryType || 'home',
      address: payload.address || null,
      paymentMethod: payload.paymentMethod || 'cod',
    };
  },
};

module.exports = checkoutService;
