const orderService = require('./order.service');
const Order = require('../../../database/models/Order');

const invoiceService = {
  buildInvoicePayload(order) {
    return {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderId: order._id,
      orderNumber: order.orderNumber,
      issuedAt: order.placedAt || order.audit?.createdAt,
      customer: { userId: order.userId },
      billingAddress: order.address,
      gstin: order.gstin || null,
      items: order.items.map((item) => ({
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        pricePaise: item.pricePaise,
        taxPaise: item.taxPaise,
        lineTotalPaise: item.lineTotalPaise,
      })),
      subtotalPaise: order.subtotalPaise,
      taxPaise: order.taxPaise,
      discountPaise: order.discountPaise,
      deliveryChargePaise: order.deliveryChargePaise,
      platformFeePaise: order.platformFeePaise,
      handlingChargePaise: order.handlingChargePaise,
      totalPaise: order.totalPaise,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    };
  },

  async generateInvoice(orderId) {
    const order = await orderService.getOrder(orderId);
    const invoice = this.buildInvoicePayload(order);
    const invoiceUrl = `/api/v1/orders/${orderId}/invoice`;

    await Order.findByIdAndUpdate(orderId, { $set: { invoiceUrl } });

    return { ...invoice, invoiceUrl, downloadMeta: { format: 'json', generatedAt: new Date() } };
  },

  async getInvoice(orderId) {
    const order = await orderService.getOrder(orderId);
    const invoice = this.buildInvoicePayload(order);
    return {
      ...invoice,
      invoiceUrl: order.invoiceUrl || `/api/v1/orders/${orderId}/invoice`,
      downloadMeta: { format: 'json', available: true },
    };
  },
};

module.exports = invoiceService;
