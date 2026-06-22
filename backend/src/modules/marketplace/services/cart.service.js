const { NotFoundError, BadRequestError, ConflictError } = require('../../../common/errors');
const cartRepository = require('../repositories/cart.repository');
const productRepository = require('../repositories/product.repository');
const variantRepository = require('../repositories/variant.repository');
const productService = require('./product.service');

const itemKey = (productId, variantId) => `${productId}:${variantId || 'base'}`;

const computeTotals = (items) => {
  const subtotalPaise = items.reduce((sum, item) => sum + item.pricePaise * item.quantity, 0);
  const taxPaise = 0;
  const discountPaise = items.reduce(
    (sum, item) => sum + Math.max(0, (item.mrpPaise - item.pricePaise) * item.quantity),
    0
  );
  return {
    subtotalPaise,
    taxPaise,
    discountPaise,
    totalPaise: subtotalPaise + taxPaise,
  };
};

const cartService = {
  itemKey,

  async getOrCreateCart(userId, audience) {
    let cart = await cartRepository.findByUser(userId, audience);
    if (!cart) {
      cart = await cartRepository.upsertCart(userId, audience, {
        items: [],
        subtotalPaise: 0,
        taxPaise: 0,
        discountPaise: 0,
        totalPaise: 0,
      });
    }
    return cart;
  },

  async validateCartItems(items) {
    for (const item of items) {
      const product = await productRepository.findOne(
        productRepository.findPublishedFilter({ _id: item.productId })
      );
      if (!product) throw new BadRequestError(`Product unavailable: ${item.productId}`, 'CART_ITEM_INVALID');

      let stock = product.stock;
      let pricePaise = product.pricePaise;
      if (item.variantId) {
        const variant = await variantRepository.findOne({ _id: item.variantId, productId: item.productId });
        if (!variant) throw new BadRequestError('Variant not found', 'CART_VARIANT_INVALID');
        stock = variant.stock;
        pricePaise = variant.pricePaise;
      }
      if (stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${product.name}`, 'INSUFFICIENT_STOCK');
      }
      if (item.pricePaise !== pricePaise) {
        throw new BadRequestError('Cart item price is outdated', 'CART_PRICE_STALE');
      }
    }
    return true;
  },

  async addItem(userId, audience, payload) {
    const product = await productRepository.findOne(
      productRepository.findPublishedFilter({ _id: payload.productId })
    );
    if (!product) throw new NotFoundError('Product not found', 'PRODUCT_NOT_FOUND');

    let variant = null;
    let pricePaise = product.pricePaise;
    let stock = product.stock;
    if (payload.variantId) {
      variant = await variantRepository.findOne({ _id: payload.variantId, productId: product._id });
      if (!variant) throw new NotFoundError('Variant not found', 'VARIANT_NOT_FOUND');
      pricePaise = variant.pricePaise;
      stock = variant.stock;
    }

    if (stock < payload.quantity) {
      throw new BadRequestError('Insufficient stock', 'INSUFFICIENT_STOCK');
    }

    const cart = await this.getOrCreateCart(userId, audience);
    const items = [...(cart.items || [])];
    const index = items.findIndex(
      (item) =>
        String(item.productId) === String(payload.productId) &&
        String(item.variantId || '') === String(payload.variantId || '')
    );

    if (index >= 0) {
      items[index].quantity += payload.quantity;
    } else {
      items.push({
        productId: product._id,
        variantId: payload.variantId || undefined,
        name: product.name,
        image: product.images?.[0]?.alt || undefined,
        sku: variant?.sku || product.sku,
        pricePaise,
        mrpPaise: product.originalPricePaise || pricePaise,
        quantity: payload.quantity,
        size: payload.size || variant?.attributes?.get?.('size'),
      });
    }

    const totals = computeTotals(items);
    return cartRepository.upsertCart(userId, audience, { items, ...totals });
  },

  async updateItemQuantity(userId, audience, productId, variantId, quantity) {
    if (quantity < 1) throw new BadRequestError('Quantity must be at least 1', 'INVALID_QUANTITY');
    const cart = await this.getOrCreateCart(userId, audience);
    const items = [...(cart.items || [])];
    const index = items.findIndex(
      (item) =>
        String(item.productId) === String(productId) &&
        String(item.variantId || '') === String(variantId || '')
    );
    if (index < 0) throw new NotFoundError('Cart item not found', 'CART_ITEM_NOT_FOUND');

    const product = await productRepository.findById(productId);
    let stock = product.stock;
    if (variantId) {
      const variant = await variantRepository.findById(variantId);
      stock = variant?.stock ?? 0;
    }
    if (stock < quantity) throw new BadRequestError('Insufficient stock', 'INSUFFICIENT_STOCK');

    items[index].quantity = quantity;
    const totals = computeTotals(items);
    return cartRepository.upsertCart(userId, audience, { items, ...totals });
  },

  async removeItem(userId, audience, productId, variantId) {
    const cart = await this.getOrCreateCart(userId, audience);
    const items = (cart.items || []).filter(
      (item) =>
        !(
          String(item.productId) === String(productId) &&
          String(item.variantId || '') === String(variantId || '')
        )
    );
    const totals = computeTotals(items);
    return cartRepository.upsertCart(userId, audience, { items, ...totals });
  },

  async clearCart(userId, audience) {
    return cartRepository.upsertCart(userId, audience, {
      items: [],
      subtotalPaise: 0,
      taxPaise: 0,
      discountPaise: 0,
      totalPaise: 0,
    });
  },

  async getCartSummary(userId, audience) {
    const cart = await this.getOrCreateCart(userId, audience);
    await this.validateCartItems(cart.items || []);
    return {
      ...cart,
      itemCount: (cart.items || []).reduce((sum, item) => sum + item.quantity, 0),
    };
  },
};

module.exports = cartService;
