const mongoose = require('mongoose');
const orderService = require('../../src/modules/orders/services/order.service');
const School = require('../../src/database/models/School');
const Order = require('../../src/database/models/Order');
const { createParentUser, seedCartForUser, defaultAddress } = require('./helpers');

// Client bug: an order's (school pickup) address showed "Indore, 452018" whatever the real
// school location, because the app filled a missing city/pincode with those defaults and the
// server stored the client's address as-is.
describe('order shipping address', () => {
  const clientAddressWithFakeDefaults = {
    name: 'Karav Bisen',
    phone: '9049192663',
    line1: 'Smart Edukidz Selu',
    city: 'Indore',
    state: 'Madhya Pradesh',
    pinCode: '452018',
    addressType: 'school',
  };

  const place = async (payload, user) =>
    orderService.createOrder(user._id, 'parent', payload, { userId: user._id, role: 'parent' });

  test('school pickup is stored with the SCHOOL\'s own address, not the one the client sent', async () => {
    const school = await School.create({
      schoolRefNo: 'SCH-SELU',
      code: 'SELU',
      name: 'Smart Edukidz Selu',
      partnerStatus: 'active',
      address: { line1: 'Main Road', city: 'Selu', state: 'Maharashtra', country: 'India', pinCode: '431503' },
    });
    const user = await createParentUser();
    await seedCartForUser(user._id);

    const order = await place(
      { deliveryType: 'school', schoolIdForPickup: String(school._id), paymentMethod: 'cod', address: clientAddressWithFakeDefaults },
      user
    );

    const stored = (await Order.findById(order._id).lean()).address;
    expect(stored.city).toBe('Selu');
    expect(stored.state).toBe('Maharashtra');
    expect(stored.pinCode).toBe('431503');
    expect(stored.line1).toBe('Smart Edukidz Selu, Main Road');
    expect(stored.addressType).toBe('school');
    expect(JSON.stringify(stored)).not.toMatch(/Indore|452018/);
    // who the parcel is for still comes from the customer
    expect(stored.name).toBe('Karav Bisen');
    expect(stored.phone).toBe('9049192663');
  });

  test('a school with no postal address still takes the order, and nothing is invented', async () => {
    const school = await School.create({ schoolRefNo: 'SCH-BARE', code: 'BARE', name: 'Bare Public School', partnerStatus: 'active' });
    const user = await createParentUser();
    await seedCartForUser(user._id);

    const order = await place(
      { deliveryType: 'school', schoolIdForPickup: String(school._id), paymentMethod: 'cod', address: clientAddressWithFakeDefaults },
      user
    );

    const stored = (await Order.findById(order._id).lean()).address;
    expect(stored.line1).toBe('Bare Public School');
    expect(stored.city || '').toBe('');
    expect(stored.pinCode || '').toBe('');
    expect(JSON.stringify(stored)).not.toMatch(/Indore|452018/);
  });

  test('school pickup needs a real school', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);

    await expect(
      place({ deliveryType: 'school', paymentMethod: 'cod', address: clientAddressWithFakeDefaults }, user)
    ).rejects.toMatchObject({ code: 'SCHOOL_PICKUP_REQUIRED' });

    await expect(
      place(
        { deliveryType: 'school', schoolIdForPickup: String(new mongoose.Types.ObjectId()), paymentMethod: 'cod', address: clientAddressWithFakeDefaults },
        user
      )
    ).rejects.toMatchObject({ code: 'SCHOOL_PICKUP_INVALID' });
  });

  test('home delivery is stored exactly as the customer entered it', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);
    const order = await place(
      { deliveryType: 'home', paymentMethod: 'cod', address: { ...defaultAddress, name: 'Asha', phone: '9876500011' } },
      user
    );
    const stored = (await Order.findById(order._id).lean()).address;
    expect(stored.city).toBe('Delhi');
    expect(stored.pinCode).toBe('110001');
    expect(stored.line1).toBe('123 Main Street');
  });

  describe('fix-school-pickup-addresses script (repairs orders that already have the fake address)', () => {
    const { findOrdersWithFakeSchoolAddress, applyFixes } = require('../../scripts/fix-school-pickup-addresses');

    const makeOrder = (user, overrides = {}) =>
      Order.create({
        orderNumber: `ORD${Date.now()}${Math.floor(Math.random() * 100000)}`.slice(0, 20),
        userId: user._id,
        audience: 'parent',
        items: [],
        vendorIds: [],
        subtotalPaise: 1000, taxPaise: 0, discountPaise: 0, platformFeePaise: 0, deliveryChargePaise: 0, handlingChargePaise: 0,
        totalPaise: 1000, walletAmountPaise: 0,
        paymentMethod: 'cod', paymentStatus: 'pending', orderStatus: 'placed',
        ...overrides,
      });

    test('only fake-default school-pickup orders are found and fixed', async () => {
      const school = await School.create({
        schoolRefNo: 'SCH-FIX', code: 'FIX', name: 'Smart Edukidz Selu', partnerStatus: 'active',
        address: { line1: 'Main Road', city: 'Selu', state: 'Maharashtra', country: 'India', pinCode: '431503' },
      });
      const user = await createParentUser();
      const fake = { name: 'Karav', phone: '9049192663', line1: 'Smart Edukidz Selu', city: 'Indore', state: 'Madhya Pradesh', pinCode: '452018' };

      const wrong = await makeOrder(user, { deliveryType: 'school', schoolIdForPickup: school._id, address: fake });
      const homeInIndore = await makeOrder(user, { deliveryType: 'home', address: { ...fake, line1: '12 Vijay Nagar' } });
      const alreadyRight = await makeOrder(user, { deliveryType: 'school', schoolIdForPickup: school._id, address: { ...fake, city: 'Selu', pinCode: '431503' } });

      const { affected, skipped } = await findOrdersWithFakeSchoolAddress({ Order, School });
      expect(skipped).toHaveLength(0);
      expect(affected.map((a) => String(a.order._id))).toEqual([String(wrong._id)]);

      expect(await applyFixes({ Order }, affected)).toBe(1);

      const fixed = (await Order.findById(wrong._id).lean()).address;
      expect(fixed).toMatchObject({ city: 'Selu', state: 'Maharashtra', pinCode: '431503', line1: 'Smart Edukidz Selu, Main Road', name: 'Karav', phone: '9049192663' });
      // a real home order in Indore, and an already-correct pickup order, are untouched
      expect((await Order.findById(homeInIndore._id).lean()).address.city).toBe('Indore');
      expect((await Order.findById(alreadyRight._id).lean()).address.city).toBe('Selu');

      // running again finds nothing
      expect((await findOrdersWithFakeSchoolAddress({ Order, School })).affected).toHaveLength(0);
    });
  });

  test('home delivery without a city or pincode is refused (no silent defaults)', async () => {
    const user = await createParentUser();
    await seedCartForUser(user._id);
    await expect(
      place({ deliveryType: 'home', paymentMethod: 'cod', address: { name: 'Asha', phone: '9876500011', line1: '12 Street', city: '', pinCode: '' } }, user)
    ).rejects.toMatchObject({ code: 'ADDRESS_REQUIRED' });
  });
});
