const checkoutService = require('../../src/modules/orders/services/checkout.service');
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
});
