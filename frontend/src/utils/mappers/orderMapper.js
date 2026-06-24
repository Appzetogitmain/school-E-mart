import { formatRupee } from './productMapper';

const PRODUCT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&h=400&fit=crop';

const isUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

export const ORDER_STATUS_LABELS = {
  placed: 'Order Placed',
  accepted: 'Accepted',
  processed: 'Processing',
  packed: 'Packed',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const formatOrderStatus = (status = '') =>
  ORDER_STATUS_LABELS[status] ||
  String(status || 'placed')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

export const formatOrderDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
};

export const formatOrderDateShort = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

export const paiseToRupees = (paise) => Number(paise || 0) / 100;

export const formatOrderAmount = (paise) => formatRupee(paise);

const resolveOrderItemImage = (image) => (isUrl(image) ? image : PRODUCT_PLACEHOLDER);

export const mapOrderForListCard = (order) => {
  const items = order?.items || [];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return {
    id: order?._id?.toString?.() || order?.id,
    orderNumber: order?.orderNumber,
    status: order?.orderStatus,
    statusLabel: formatOrderStatus(order?.orderStatus),
    paymentStatus: order?.paymentStatus,
    date: formatOrderDate(order?.placedAt || order?.audit?.createdAt),
    price: formatOrderAmount(order?.totalPaise),
    itemCount: itemCount || items.length,
    items: items.slice(0, 3).map((item, index) => ({
      id: item.productId?.toString?.() || index,
      image: resolveOrderItemImage(item.image),
      name: item.name,
    })),
    raw: order,
  };
};

export const mapOrderForDetail = (order) => {
  const items = order?.items || [];
  const itemCount = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return {
    id: order?._id?.toString?.() || order?.id,
    orderNumber: order?.orderNumber,
    orderStatus: order?.orderStatus,
    statusLabel: formatOrderStatus(order?.orderStatus),
    paymentStatus: order?.paymentStatus,
    paymentMethod:
      order?.paymentMethod === 'online' ? 'ONLINE PAYMENT' : 'CASH ON DELIVERY',
    address: order?.address?.line1
      ? [order.address.line1, order.address.city, order.address.pinCode]
          .filter(Boolean)
          .join(', ')
      : '',
    city: order?.address?.city || '',
    subtotal: paiseToRupees(order?.subtotalPaise),
    shipping: paiseToRupees(order?.deliveryChargePaise),
    handling: paiseToRupees(order?.handlingChargePaise),
    platformFee: paiseToRupees(order?.platformFeePaise),
    totalAmount: paiseToRupees(order?.totalPaise),
    itemsCount: itemCount || items.length,
    placedAt: order?.placedAt,
    deliveredAt: order?.deliveredAt,
    timeline: order?.statusHistory || [],
    items,
    raw: order,
  };
};

export const mapTrackOrderResult = (payload) => {
  const order = payload?.order;
  if (!order) return null;

  const timeline = order.timeline || [];
  const steps = timeline.length
    ? timeline.map((entry, index) => ({
        title: formatOrderStatus(entry.status),
        date: formatOrderDate(entry.at),
        completed: true,
        active:
          index === timeline.length - 1 &&
          !['delivered', 'cancelled'].includes(order.orderStatus),
      }))
    : [
        {
          title: formatOrderStatus(order.orderStatus),
          date: formatOrderDate(order.placedAt),
          completed: true,
          active: !['delivered', 'cancelled'].includes(order.orderStatus),
        },
      ];

  return {
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    statusLabel: formatOrderStatus(order.orderStatus),
    paymentStatus: order.paymentStatus,
    placedAt: order.placedAt,
    deliveredAt: order.deliveredAt,
    steps,
  };
};

export const canCustomerCancelOrder = (status = '') =>
  ['placed', 'accepted'].includes(String(status).toLowerCase());

export const mapOrderForAdminList = (order) => {
  const items = order?.items || [];

  return {
    id: order?.orderNumber,
    mongoId: order?._id?.toString?.() || order?.id,
    customer: order?.address?.name || order?.address?.recipientName || 'Customer',
    address: [order?.address?.line1, order?.address?.city].filter(Boolean).join(', '),
    date: formatOrderDateShort(order?.placedAt || order?.audit?.createdAt),
    status: formatOrderStatus(order?.orderStatus),
    statusRaw: order?.orderStatus,
    deliveryStatus: formatOrderStatus(order?.orderStatus),
    amount: paiseToRupees(order?.totalPaise),
    seller: order?.vendorIds?.length ? `${order.vendorIds.length} vendor(s)` : '—',
    items: items.map((item) => ({
      name: item.name,
      qty: item.quantity,
      price: paiseToRupees(item.pricePaise),
    })),
    raw: order,
  };
};

export const getOrderStatusStyle = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (normalized === 'delivered') return 'bg-primary text-white border-primary/20';
  if (['shipped', 'out_for_delivery'].includes(normalized)) {
    return 'bg-blue-500 text-white border-blue-200';
  }
  if (['placed', 'accepted', 'processed', 'packed'].includes(normalized)) {
    return 'bg-deep-purple text-white border-deep-purple/20';
  }
  if (normalized === 'cancelled') return 'bg-red-100 text-red-600 border-red-200';
  return 'bg-gray-100 text-gray-500 border-gray-200';
};

export const buildCheckoutAddress = (source = {}) => ({
  line1: source.address || source.line1 || source.schoolAddress || 'Address not provided',
  line2: source.line2,
  city: source.city || 'Indore',
  state: source.state || 'Madhya Pradesh',
  country: source.country || 'India',
  pinCode: String(source.pinCode || source.pincode || '452018').slice(0, 6),
});

export const buildCheckoutPayload = ({
  deliveryType,
  paymentMethod,
  addressSource,
  schoolIdForPickup,
  gstin,
  summary,
}) => ({
  deliveryType,
  paymentMethod,
  address: buildCheckoutAddress(addressSource),
  ...(deliveryType === 'school' && schoolIdForPickup
    ? { schoolIdForPickup }
    : {}),
  ...(gstin ? { gstin } : {}),
  ...(summary?.deliveryChargePaise !== undefined
    ? { deliveryChargePaise: summary.deliveryChargePaise }
    : {}),
  ...(summary?.platformFeePaise !== undefined
    ? { platformFeePaise: summary.platformFeePaise }
    : {}),
  ...(summary?.handlingChargePaise !== undefined
    ? { handlingChargePaise: summary.handlingChargePaise }
    : {}),
});

export const summaryTotalsToDisplay = (summary) => ({
  subtotal: paiseToRupees(summary?.subtotalPaise),
  tax: paiseToRupees(summary?.taxPaise),
  discount: paiseToRupees(summary?.discountPaise),
  deliveryCharge: paiseToRupees(summary?.deliveryChargePaise),
  platformFee: paiseToRupees(summary?.platformFeePaise),
  handlingCharge: paiseToRupees(summary?.handlingChargePaise),
  grandTotal: paiseToRupees(summary?.totalPaise),
});
