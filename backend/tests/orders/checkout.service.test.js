const mongoose = require('mongoose');
const checkoutService = require('../../src/modules/orders/services/checkout.service');
const cartService = require('../../src/modules/marketplace/services/cart.service');
const kitsService = require('../../src/modules/academics/services/kits.service');
const { createParentUser, seedCartForUser, defaultAddress } = require('./helpers');

describe('checkout service', () => {
  test('validates cart and builds order summary with tax', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);

    const summary = await checkoutService.getOrderSummary(user._id, 'parent', {
      address: defaultAddress,
      deliveryType: 'home',
      paymentMethod: 'cod',
    });

    expect(summary.itemCount).toBe(1);
    expect(summary.totalPaise).toBeGreaterThan(0);
    expect(summary.items[0].vendorId).toBeDefined();
  });

  test('rejects empty cart checkout', async () => {
    const user = await createParentUser();
    await expect(
      checkoutService.validateCheckout(user._id, 'parent', { address: defaultAddress })
    ).rejects.toMatchObject({ code: 'CART_EMPTY' });
  });

  test('rejects incomplete shipping address', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);

    expect(() =>
      checkoutService.validateShipping({ address: { line1: 'Only line' }, deliveryType: 'home' })
    ).toThrow();
  });

  describe('kit size/color selections', () => {
    let schoolId;
    let vendorId;

    beforeEach(() => {
      schoolId = new mongoose.Types.ObjectId();
      vendorId = new mongoose.Types.ObjectId();
    });

    test('carries the parent\'s chosen size/color into the kitItems snapshot', async () => {
      const user = await createParentUser();
      const kit = await kitsService.createKit(schoolId, {
        name: 'Uniform Kit',
        status: 'active',
        vendorId,
        items: [{
          name: 'Shirt',
          category: 'Uniform',
          qty: 1,
          attributes: { sizes: ['S', 'M', 'L'], colors: ['White', 'Sky Blue'] },
        }],
      });
      await cartService.addItem(user._id, 'parent', {
        productId: kit._id,
        quantity: 1,
        kitSelections: [{ itemIndex: 0, size: 'M', color: 'White' }],
      });

      const { lineItems } = await checkoutService.validateCheckout(user._id, 'parent', {}, true);
      expect(lineItems[0].kitItems[0]).toMatchObject({ selectedSize: 'M', selectedColor: 'White' });
    });

    test('re-validates the selection against the live kit at checkout, not just at add-to-cart time', async () => {
      const user = await createParentUser();
      const kit = await kitsService.createKit(schoolId, {
        name: 'Uniform Kit',
        status: 'active',
        vendorId,
        items: [{
          name: 'Shirt',
          category: 'Uniform',
          qty: 1,
          attributes: { sizes: ['S', 'M', 'L'], colors: ['White'] },
        }],
      });
      await cartService.addItem(user._id, 'parent', {
        productId: kit._id,
        quantity: 1,
        kitSelections: [{ itemIndex: 0, size: 'M', color: 'White' }],
      });

      // The school removes 'M' after it was added to the cart.
      await kitsService.updateKit(schoolId, kit._id, {
        items: [{
          name: 'Shirt',
          category: 'Uniform',
          qty: 1,
          attributes: { sizes: ['S', 'L'], colors: ['White'] },
        }],
      });

      await expect(
        checkoutService.validateCheckout(user._id, 'parent', {}, true)
      ).rejects.toMatchObject({ code: 'KIT_INVALID_SIZE' });
    });
  });
});
