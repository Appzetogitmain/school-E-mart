const mongoose = require('mongoose');
const Order = require('../../src/database/models/Order');
const Payment = require('../../src/database/models/Payment');
const reconciliationService = require('../../src/modules/orders/services/reconciliation.service');
const refundService = require('../../src/modules/orders/services/refund.service');
const paymentGateway = require('../../src/services/paymentGateway');
const { createParentUser } = require('./helpers');

describe('reconciliation and refund enhancements', () => {
  let user;

  beforeEach(async () => {
    user = await createParentUser();
  });

  const createTestOrder = async (overrides = {}) => {
    const suffix = String(Date.now()) + String(Math.floor(Math.random() * 1000));
    return Order.create({
      orderNumber: `ORD${suffix}`.slice(0, 20),
      userId: user._id,
      audience: 'parent',
      items: [],
      vendorIds: [],
      subtotalPaise: 100000,
      taxPaise: 0,
      discountPaise: 0,
      platformFeePaise: 0,
      deliveryChargePaise: 0,
      handlingChargePaise: 0,
      totalPaise: 100000,
      walletAmountPaise: 0,
      address: { name: 'Asha Mehta', phone: '9876500011', line1: 'A1', city: 'Indore', pinCode: '452001' },
      deliveryType: 'home',
      paymentMethod: 'online',
      paymentStatus: 'pending',
      orderStatus: 'cancelled',
      cancellation: { at: new Date(), reason: 'Payment was not completed in time' },
      ...overrides,
    });
  };

  const createTestPayment = async (orderId, overrides = {}) => {
    const suffix = String(Date.now()) + String(Math.floor(Math.random() * 10000));
    return Payment.create({
      orderId,
      userId: user._id,
      amountPaise: 100000,
      currency: 'INR',
      method: 'card',
      idempotencyKey: `idemp_${suffix}`,
      gateway: 'razorpay',
      gatewayOrderId: `order_${suffix}`,
      gatewayPaymentId: `pay_${suffix}`,
      status: 'captured',
      amountCapturedPaise: 100000,
      ...overrides,
    });
  };

  test('reinstateCancelledOrder promotes cancelled order to placed and paid when money was captured', async () => {
    const order = await createTestOrder();

    const payment = await createTestPayment(order._id, {
      gatewayOrderId: 'order_TEST_REINSTATE',
      gatewayPaymentId: 'pay_TEST_REINSTATE',
      'reconciliation.status': 'mismatch',
      'reconciliation.code': 'CAPTURED_ON_CANCELLED_ORDER',
    });

    const reinstated = await reconciliationService.reinstateCancelledOrder(order._id, {
      actorUserId: user._id,
      note: 'Reinstated by admin',
    });

    expect(reinstated.orderStatus).toBe('placed');
    expect(reinstated.paymentStatus).toBe('paid');
    expect(reinstated.cancellation).toBeNull();

    // Verify database state
    const freshOrder = await Order.findById(order._id).lean();
    expect(freshOrder.orderStatus).toBe('placed');
    expect(freshOrder.paymentStatus).toBe('paid');

    // Verify mismatch is resolved
    const freshPayment = await Payment.findById(payment._id).lean();
    expect(freshPayment.reconciliation.status).toBe('resolved');
  });

  test('reinstateCancelledOrder refuses to reinstate if captured money is short', async () => {
    const order = await createTestOrder();

    await createTestPayment(order._id, {
      gatewayOrderId: 'order_TEST_SHORT',
      gatewayPaymentId: 'pay_TEST_SHORT',
      amountPaise: 50000, // Short
      amountCapturedPaise: 50000,
    });

    await expect(
      reconciliationService.reinstateCancelledOrder(order._id)
    ).rejects.toThrow('Cannot reinstate: captured amount is less than amount owed');
  });

  test('requestRefund allows refund on a cancelled order with captured payment', async () => {
    const order = await createTestOrder();

    await createTestPayment(order._id, {
      gateway: 'internal',
      gatewayPaymentId: 'pay_TEST_REFUND_CANCELLED',
      status: 'captured',
      amountCapturedPaise: 100000,
    });

    const result = await refundService.requestRefund(
      order._id,
      { reason: 'Customer requested refund after cancellation' },
      { userId: user._id }
    );

    expect(result).toBeDefined();
    expect(result.refunds.length).toBe(1);
    expect(result.refunds[0].amountPaise).toBe(100000);
  });

  test('auto-fetches gatewayPaymentId from Razorpay when initiating refund if missing', async () => {
    const order = await createTestOrder();

    const payment = await createTestPayment(order._id, {
      gateway: 'razorpay',
      gatewayOrderId: 'order_TEST_AUTO_FETCH',
      gatewayPaymentId: null, // deliberately null
      status: 'captured',
      amountCapturedPaise: 100000,
    });

    const fetchSpy = jest
      .spyOn(paymentGateway, 'fetchPaymentsForOrder')
      .mockResolvedValue([
        { id: 'pay_AUTO_FETCHED_123', status: 'captured', amount: 100000 },
      ]);

    const refundSpy = jest
      .spyOn(paymentGateway, 'initiateRefund')
      .mockResolvedValue({
        refundId: 'rfnd_AUTO_FETCHED_REFUND',
        status: 'processed',
        amount: 100000,
      });

    const result = await refundService.requestRefund(
      order._id,
      { reason: 'Auto-fetched payment id refund' },
      { userId: user._id }
    );

    expect(fetchSpy).toHaveBeenCalledWith('order_TEST_AUTO_FETCH', 'razorpay');
    expect(refundSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        gatewayPaymentId: 'pay_AUTO_FETCHED_123',
        amountPaise: 100000,
      })
    );

    const updatedPayment = await Payment.findById(payment._id).lean();
    expect(updatedPayment.gatewayPaymentId).toBe('pay_AUTO_FETCHED_123');

    fetchSpy.mockRestore();
    refundSpy.mockRestore();
  });
});
