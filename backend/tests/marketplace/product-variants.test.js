const mongoose = require('mongoose');
const taxonomyService = require('../../src/modules/marketplace/services/taxonomy.service');
const productService = require('../../src/modules/marketplace/services/product.service');
const cartService = require('../../src/modules/marketplace/services/cart.service');
const orderService = require('../../src/modules/orders/services/order.service');
const cancellationService = require('../../src/modules/orders/services/cancellation.service');
const VendorProfile = require('../../src/database/models/VendorProfile');
const Product = require('../../src/database/models/Product');
const ProductVariant = require('../../src/database/models/ProductVariant');
const {
  normalizeVariantInputs,
  summarizeVariants,
  serializeVariants,
} = require('../../src/modules/marketplace/utils/variants.util');
const { createParentUser, defaultAddress } = require('../orders/helpers');

describe('variants util', () => {
  test('accepts valid variants and trims names', () => {
    const out = normalizeVariantInputs([
      { label: ' 100ml ', pricePaise: 2900, originalPricePaise: 3900, stock: 3 },
      { label: '500ml', pricePaise: '9900', stock: '10' },
    ]);
    expect(out).toEqual([
      { label: '100ml', pricePaise: 2900, originalPricePaise: 3900, stock: 3 },
      { label: '500ml', pricePaise: 9900, originalPricePaise: null, stock: 10 },
    ]);
  });

  test.each([
    [[{ label: '', pricePaise: 100, stock: 1 }], /enter a name/i],
    [[{ label: 'A', pricePaise: 0, stock: 1 }], /selling price/i],
    [[{ label: 'A', pricePaise: 100, stock: -1 }], /stock/i],
    [[{ label: 'A', pricePaise: 100, stock: 1.5 }], /stock/i],
    [[{ label: 'A', pricePaise: 100, originalPricePaise: 50, stock: 1 }], /MRP cannot be less/i],
    [[{ label: 'A', pricePaise: 100, stock: 1 }, { label: ' a ', pricePaise: 200, stock: 1 }], /added twice/i],
  ])('rejects bad input %#', (input, message) => {
    expect(() => normalizeVariantInputs(input)).toThrow(message);
  });

  test('product price is the lowest variant price, stock the total', () => {
    expect(
      summarizeVariants([
        { label: 'S', pricePaise: 5000, originalPricePaise: 6000, stock: 2 },
        { label: 'M', pricePaise: 3000, originalPricePaise: 4000, stock: 5 },
        { label: 'L', pricePaise: 8000, originalPricePaise: null, stock: 0 },
      ])
    ).toEqual({ pricePaise: 3000, originalPricePaise: 4000, stock: 7, sizes: ['S', 'M', 'L'] });
    expect(summarizeVariants([{ label: 'S', pricePaise: 3000, originalPricePaise: 3000, stock: 1 }]).originalPricePaise).toBeNull();
    expect(summarizeVariants([])).toBeNull();
  });
});

describe('product variants (vendor adds a product with several variants)', () => {
  let vendorId;
  let headerId;
  let categoryId;

  const baseProduct = (extra = {}) => ({
    name: 'Fresh Milk',
    sku: `MILK-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    headerId,
    categoryId,
    images: [{ attachmentId: new mongoose.Types.ObjectId() }],
    approvalStatus: 'approved',
    publishStatus: 'published',
    audience: 'users',
    ...extra,
  });

  const threeVariants = () => [
    { label: '100ml', pricePaise: 2900, originalPricePaise: 3900, stock: 3 },
    { label: '500ml', pricePaise: 9900, originalPricePaise: 12900, stock: 10 },
    { label: '1L', pricePaise: 17900, stock: 4 },
  ];

  beforeEach(async () => {
    headerId = (await taxonomyService.createHeaderCategory({ name: 'Grocery' }))._id;
    categoryId = (await taxonomyService.createCategory({ headerId, name: 'Dairy' }))._id;
    vendorId = (
      await VendorProfile.create({
        userId: new mongoose.Types.ObjectId(),
        storeName: 'Dairy Vendor',
        storeSlug: 'dairy-vendor',
        commissionPercent: 10,
        approvalStatus: 'approved',
        address: { line1: 'L', city: 'C', state: 'S', country: 'India', pinCode: '110001' },
        location: { type: 'Point', coordinates: [77.2, 28.6] },
        serviceRadiusKm: 10,
      })
    )._id;
  });

  test('creating a product with variants stores each variant and derives price / stock / sizes', async () => {
    const product = await productService.createProduct(vendorId, baseProduct({ variants: threeVariants() }));

    expect(product.pricePaise).toBe(2900); // from the lowest variant
    expect(product.originalPricePaise).toBe(3900);
    expect(product.stock).toBe(17);
    expect(product.sizes).toEqual(['100ml', '500ml', '1L']);
    expect(product.variants).toHaveLength(3);

    const saved = await ProductVariant.find({ productId: product._id }).sort({ _id: 1 }).lean();
    expect(saved.map((v) => [v.attributes.size, v.pricePaise, v.originalPricePaise ?? null, v.stock])).toEqual([
      ['100ml', 2900, 3900, 3],
      ['500ml', 9900, 12900, 10],
      ['1L', 17900, null, 4],
    ]);
    expect(new Set(saved.map((v) => v.sku)).size).toBe(3); // unique SKUs generated
  });

  test('a product without variants still works exactly as before', async () => {
    const product = await productService.createProduct(vendorId, baseProduct({ pricePaise: 4500, stock: 12 }));
    expect(product.pricePaise).toBe(4500);
    expect(product.stock).toBe(12);
    expect(product.variants || []).toHaveLength(0);
  });

  test('invalid variants are refused and nothing is half-created', async () => {
    await expect(
      productService.createProduct(vendorId, baseProduct({ variants: [{ label: 'A', pricePaise: 100, stock: 1 }, { label: 'a', pricePaise: 200, stock: 1 }] }))
    ).rejects.toMatchObject({ code: 'VARIANT_INVALID' });
    expect(await Product.countDocuments({})).toBe(0);
  });

  test('public product detail includes the variants for the customer to choose from', async () => {
    const created = await productService.createProduct(vendorId, baseProduct({ variants: threeVariants() }));
    const detail = await productService.getProduct(created._id, { publicOnly: true, withVariants: true });
    const variants = serializeVariants(detail.variants);
    expect(variants.map((v) => [v.label, v.pricePaise, v.originalPricePaise, v.stock])).toEqual([
      ['100ml', 2900, 3900, 3],
      ['500ml', 9900, 12900, 10],
      ['1L', 17900, null, 4],
    ]);
    expect(variants[0].id).toBeTruthy();
  });

  test('GET /catalog/products/:id (the real route) returns the variants, and still works for a plain product', async () => {
    const request = require('supertest');
    const { createApp } = require('../../src/app');
    const app = createApp();

    const withVariants = await productService.createProduct(vendorId, baseProduct({ variants: threeVariants() }));
    const res = await request(app).get(`/api/v1/catalog/products/${withVariants._id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.product.variants.map((v) => [v.label, v.pricePaise, v.originalPricePaise, v.stock])).toEqual([
      ['100ml', 2900, 3900, 3],
      ['500ml', 9900, 12900, 10],
      ['1L', 17900, null, 4],
    ]);
    expect(res.body.data.product.pricePaise).toBe(2900);

    const plain = await productService.createProduct(vendorId, baseProduct({ pricePaise: 4500, stock: 12 }));
    const plainRes = await request(app).get(`/api/v1/catalog/products/${plain._id}`);
    expect(plainRes.status).toBe(200);
    expect(plainRes.body.data.product.variants).toEqual([]);
    expect(plainRes.body.data.product.pricePaise).toBe(4500);
  });

  test('editing: update, add and remove variants in one save', async () => {
    const created = await productService.createProduct(vendorId, baseProduct({ variants: threeVariants() }));
    const [small, medium] = serializeVariants((await productService.getProduct(created._id, { withVariants: true })).variants);

    const updated = await productService.updateProduct(created._id, {
      variants: [
        { id: small.id, label: '100 ml', pricePaise: 3100, originalPricePaise: null, stock: 8 }, // edited
        { id: medium.id, label: '500ml', pricePaise: 9900, originalPricePaise: 12900, stock: 10 }, // unchanged
        { label: '2L', pricePaise: 29900, stock: 6 }, // new
        // the 1L variant is not listed -> removed
      ],
    });

    expect(updated.pricePaise).toBe(3100);
    expect(updated.originalPricePaise == null).toBe(true); // cheapest variant has no MRP
    expect(updated.stock).toBe(24);
    expect(updated.sizes).toEqual(['100 ml', '500ml', '2L']);
    const labels = (await ProductVariant.find({ productId: created._id }).lean()).map((v) => v.attributes.size).sort();
    expect(labels).toEqual(['100 ml', '2L', '500ml']);
    // the edited variant kept its id (carts / orders that point at it stay valid)
    expect((await ProductVariant.findById(small.id).lean()).pricePaise).toBe(3100);
  });

  test('an empty variant list turns it back into a simple product', async () => {
    const created = await productService.createProduct(vendorId, baseProduct({ variants: threeVariants() }));
    const updated = await productService.updateProduct(created._id, { variants: [], pricePaise: 5000, stock: 9 });
    expect(updated.pricePaise).toBe(5000);
    expect(updated.stock).toBe(9);
    expect(await ProductVariant.countDocuments({ productId: created._id })).toBe(0);
    expect(updated.sizes).toEqual([]);
  });

  test('a plain price or stock edit is refused while the product has variants', async () => {
    const created = await productService.createProduct(vendorId, baseProduct({ variants: threeVariants() }));
    await expect(productService.updateProduct(created._id, { pricePaise: 100 })).rejects.toMatchObject({ code: 'PRODUCT_HAS_VARIANTS' });
    await expect(productService.updateInventory(created._id, { stock: 5 })).rejects.toMatchObject({ code: 'PRODUCT_HAS_VARIANTS' });
    // other fields can still be edited
    expect((await productService.updateProduct(created._id, { description: 'Farm fresh' })).description).toBe('Farm fresh');
  });

  describe('customer buys a chosen variant', () => {
    let product;
    let variants;
    let user;

    beforeEach(async () => {
      product = await productService.createProduct(vendorId, baseProduct({ variants: threeVariants() }));
      variants = serializeVariants((await productService.getProduct(product._id, { withVariants: true })).variants);
      user = await createParentUser();
    });

    const byLabel = (label) => variants.find((v) => v.label === label);

    test('a variant must be chosen', async () => {
      await expect(
        cartService.addItem(user._id, 'parent', { productId: product._id, quantity: 1 })
      ).rejects.toMatchObject({ code: 'VARIANT_REQUIRED' });
    });

    test('cart line uses the variant price, MRP and name; stock is checked per variant', async () => {
      const cart = await cartService.addItem(user._id, 'parent', { productId: product._id, variantId: byLabel('500ml').id, quantity: 2 });
      const line = cart.items[0];
      expect(line.pricePaise).toBe(9900);
      expect(line.mrpPaise).toBe(12900);
      expect(line.size).toBe('500ml');
      expect(String(line.variantId)).toBe(byLabel('500ml').id);

      // only 3 x 100ml in stock
      await expect(
        cartService.addItem(user._id, 'parent', { productId: product._id, variantId: byLabel('100ml').id, quantity: 4 })
      ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });

      // different variants of one product are separate lines
      const two = await cartService.addItem(user._id, 'parent', { productId: product._id, variantId: byLabel('100ml').id, quantity: 1 });
      expect(two.items).toHaveLength(2);
    });

    test('ordering a variant sells that variant only, product stock stays the total, cancelling restores it', async () => {
      await cartService.addItem(user._id, 'parent', { productId: product._id, variantId: byLabel('500ml').id, quantity: 2 });
      const order = await orderService.createOrder(
        user._id,
        'parent',
        { address: defaultAddress, deliveryType: 'home', paymentMethod: 'cod' },
        { userId: user._id, role: 'parent' }
      );

      expect(order.items[0].pricePaise).toBe(9900);
      expect(order.items[0].size).toBe('500ml');
      expect(order.subtotalPaise).toBe(19800);

      const stock = async () =>
        Object.fromEntries((await ProductVariant.find({ productId: product._id }).lean()).map((v) => [v.attributes.size, v.stock]));
      expect(await stock()).toEqual({ '100ml': 3, '500ml': 8, '1L': 4 });
      const afterSale = await Product.findById(product._id).lean();
      expect(afterSale.stock).toBe(15);
      expect(afterSale.salesCount).toBe(2);

      await cancellationService.cancelOrder(order._id, { reason: 'Changed mind', cancelledBy: user._id }, { role: 'customer' });
      expect(await stock()).toEqual({ '100ml': 3, '500ml': 10, '1L': 4 });
      const afterCancel = await Product.findById(product._id).lean();
      expect(afterCancel.stock).toBe(17);
      expect(afterCancel.salesCount).toBe(0);
    });

    test('over HTTP: add a variant, raise / lower its quantity and remove it (variantId in the query)', async () => {
      const request = require('supertest');
      const { createApp } = require('../../src/app');
      const { authHeaderFor } = require('../orders/helpers');
      const app = createApp();
      const auth = await authHeaderFor(user, 'parent');
      const variantId = byLabel('500ml').id;
      const lines = (res) => (res.body.data.cart.items || []).map((i) => [i.size, i.quantity]);

      let res = await request(app).post('/api/v1/catalog/cart/items?audience=parent').set('Authorization', auth)
        .send({ productId: String(product._id), variantId, quantity: 1, size: '500ml' });
      expect(res.status).toBe(201);

      res = await request(app).patch(`/api/v1/catalog/cart/items/${product._id}?audience=parent&variantId=${variantId}`)
        .set('Authorization', auth).send({ quantity: 3 });
      expect(res.status).toBe(200);
      expect(lines(res)).toEqual([['500ml', 3]]);

      // a second variant is its own line and does not disturb the first
      await request(app).post('/api/v1/catalog/cart/items?audience=parent').set('Authorization', auth)
        .send({ productId: String(product._id), variantId: byLabel('1L').id, quantity: 1 });
      res = await request(app).patch(`/api/v1/catalog/cart/items/${product._id}?audience=parent&variantId=${byLabel('1L').id}`)
        .set('Authorization', auth).send({ quantity: 2 });
      expect(lines(res).sort()).toEqual([['1L', 2], ['500ml', 3]]);

      res = await request(app).delete(`/api/v1/catalog/cart/items/${product._id}?audience=parent&variantId=${variantId}`)
        .set('Authorization', auth);
      expect(res.status).toBe(200);
      expect(lines(res)).toEqual([['1L', 2]]);
    });

    test('changing a variant price after it is in the cart makes the cart line stale (customer must refresh)', async () => {
      await cartService.addItem(user._id, 'parent', { productId: product._id, variantId: byLabel('500ml').id, quantity: 1 });
      await productService.updateVariant(product._id, byLabel('500ml').id, { pricePaise: 10500 });
      const stored = await Product.findById(product._id).lean();
      expect(stored.pricePaise).toBe(2900); // still the cheapest
      await expect(
        orderService.createOrder(user._id, 'parent', { address: defaultAddress, deliveryType: 'home', paymentMethod: 'cod' }, { userId: user._id, role: 'parent' })
      ).rejects.toMatchObject({ code: 'CART_PRICE_STALE' });
    });
  });
});
