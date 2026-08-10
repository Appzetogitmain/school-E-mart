const mongoose = require('mongoose');
const orderService = require('./order.service');
const Order = require('../../../database/models/Order');
const VendorProfile = require('../../../database/models/VendorProfile');
const User = require('../../../database/models/User');

const invoiceService = {
  async buildInvoicePayload(order) {
    // 1. Fetch Customer Profile Info safely
    let customerUser = null;
    if (order.userId && mongoose.Types.ObjectId.isValid(String(order.userId))) {
      customerUser = await User.findById(order.userId).select('name phone email').lean();
    }

    // 2. Fetch Vendor / Seller Profiles safely
    const rawVendorIds = order.vendorIds || [];
    const itemVendorIds = (order.items || []).map((i) => i.vendorId).filter(Boolean);
    const validVendorIds = [...new Set([...rawVendorIds.map(String), ...itemVendorIds.map(String)])]
      .filter((vId) => mongoose.Types.ObjectId.isValid(vId));

    let vendorProfiles = [];
    if (validVendorIds.length > 0) {
      vendorProfiles = await VendorProfile.find({ _id: { $in: validVendorIds } })
        .populate('userId', 'name phone email')
        .lean();
    }

    const sellers = vendorProfiles.map((vp) => {
      const addrParts = vp.address
        ? [vp.address.line1, vp.address.line2, vp.address.city, vp.address.state, vp.address.pinCode]
            .filter(Boolean)
            .join(', ')
        : '';
      return {
        vendorId: vp._id,
        storeName: vp.storeName || 'Vendor Partner',
        gstin: vp.gstin || null,
        panCard: vp.panCard || null,
        address: addrParts,
        addressObj: vp.address || null,
        phone: vp.userId?.phone || '',
        email: vp.userId?.email || '',
      };
    });

    const primarySeller = sellers[0] || {
      storeName: 'School E-Mart Vendor Partner',
      gstin: order.gstin || null,
      address: 'Authorized Fulfillment Location',
      phone: '',
      email: '',
    };

    return {
      invoiceNumber: `INV-${order.orderNumber}`,
      orderId: order._id,
      orderNumber: order.orderNumber,
      issuedAt: order.placedAt || order.audit?.createdAt || new Date(),
      seller: primarySeller,
      sellers,
      customer: {
        userId: order.userId,
        name: customerUser?.name || order.address?.name || 'Customer',
        phone: customerUser?.phone || order.address?.phone || '',
        email: customerUser?.email || '',
      },
      billingAddress: order.address || {},
      shippingAddress: order.address || {},
      gstin: order.gstin || null,
      items: (order.items || []).map((item) => {
        const pricePaise = Number(item.pricePaise || 0);
        const quantity = Number(item.quantity || 1);
        const lineTotalPaise = item.lineTotalPaise ?? (pricePaise * quantity);
        return {
          name: item.name || 'Product',
          sku: item.sku || null,
          quantity,
          pricePaise,
          taxPaise: Number(item.taxPaise || 0),
          lineTotalPaise,
          vendorId: item.vendorId || null,
        };
      }),
      subtotalPaise: Number(order.subtotalPaise || 0),
      taxPaise: Number(order.taxPaise || 0),
      discountPaise: Number(order.discountPaise || 0),
      deliveryChargePaise: Number(order.deliveryChargePaise || 0),
      platformFeePaise: Number(order.platformFeePaise || 0),
      handlingChargePaise: Number(order.handlingChargePaise || 0),
      totalPaise: Number(order.totalPaise || 0),
      walletAmountPaise: Number(order.walletAmountPaise || 0),
      paymentMethod: order.paymentMethod || 'COD',
      paymentStatus: order.paymentStatus || 'pending',
      orderStatus: order.orderStatus || 'placed',
    };
  },

  async generateInvoice(orderId) {
    const order = await orderService.getOrder(orderId);
    const invoice = await this.buildInvoicePayload(order);
    const invoiceUrl = `/api/v1/orders/${orderId}/invoice`;

    await Order.findByIdAndUpdate(orderId, { $set: { invoiceUrl } });

    return { ...invoice, invoiceUrl, downloadMeta: { format: 'json', generatedAt: new Date() } };
  },

  async getInvoice(orderId) {
    const order = await orderService.getOrder(orderId);
    const invoice = await this.buildInvoicePayload(order);
    return {
      ...invoice,
      invoiceUrl: order.invoiceUrl || `/api/v1/orders/${orderId}/invoice`,
      downloadMeta: { format: 'json', available: true },
    };
  },
};

module.exports = invoiceService;
