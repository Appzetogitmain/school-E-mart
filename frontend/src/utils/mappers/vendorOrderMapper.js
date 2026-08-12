import {
  formatOrderDateShort,
  formatOrderStatus,
  paiseToRupees,
} from './orderMapper';
import { formatRupee } from './productMapper';

export const getVendorOrderStatusStyle = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (normalized === 'delivered') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (['shipped', 'out_for_delivery'].includes(normalized)) {
    return 'bg-sky-50 text-sky-700 border-sky-100';
  }
  if (['placed', 'accepted', 'processed', 'packed'].includes(normalized)) {
    return 'bg-amber-50 text-amber-700 border-amber-100';
  }
  if (normalized === 'cancelled') return 'bg-red-50 text-red-600 border-red-100';
  return 'bg-gray-50 text-gray-500 border-gray-150';
};

const sumVendorItemsPaise = (order) => {
  const items = order?.vendorItems || order?.items || [];
  return items.reduce((sum, item) => sum + (item.lineTotalPaise || 0), 0);
};

// RFQ-awarded orders collect payment as an advance up front, then the
// remainder any time after — two separate captures on the same order,
// distinct from a normal single-payment order. Vendors need to see that
// split explicitly (not just "totalPaise"), and know delivery is blocked
// until the remainder actually lands.
const mapPaymentSplit = (order) => {
  const rfqAdvance = order?.rfqAdvance;
  if (!rfqAdvance) {
    return {
      isRfqOrder: false,
      paymentStatusRaw: order?.paymentStatus || null,
      advancePaise: null,
      remainderPaise: null,
      advancePaid: null,
      remainderPaid: null,
      paymentSplitLabel: null,
      paymentSplitColor: null,
    };
  }

  const paymentStatusRaw = order?.paymentStatus || 'pending';
  const advancePaid = paymentStatusRaw === 'partially_paid' || paymentStatusRaw === 'paid';
  const remainderPaid = paymentStatusRaw === 'paid';
  const advancePaise = rfqAdvance.advancePaise ?? 0;
  const remainderPaise = rfqAdvance.remainderPaise ?? 0;

  let paymentSplitLabel;
  let paymentSplitColor;
  if (remainderPaid) {
    paymentSplitLabel = 'Advance + Remaining Received — Fully Paid';
    paymentSplitColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
  } else if (advancePaid) {
    paymentSplitLabel = `Advance Received — ₹${paiseToRupees(remainderPaise).toFixed(2)} Remaining Pending`;
    paymentSplitColor = 'bg-amber-50 text-amber-700 border-amber-100';
  } else {
    paymentSplitLabel = 'Advance Payment Pending';
    paymentSplitColor = 'bg-red-50 text-red-600 border-red-100';
  }

  return {
    isRfqOrder: true,
    paymentStatusRaw,
    advancePaise,
    remainderPaise,
    advancePaid,
    remainderPaid,
    paymentSplitLabel,
    paymentSplitColor,
  };
};

const mapVendorOrderItems = (items = []) =>
  items.map((item, index) => ({
    itemIndex: index,
    srNo: item.sku?.slice(-4) || String(index + 1).padStart(4, '0'),
    name: item.name,
    unit: item.size || 'unit',
    price: paiseToRupees(item.pricePaise),
    tax: `${paiseToRupees(item.taxPaise || 0).toFixed(2)} (${item.taxRatePercent || 0}%)`,
    qty: item.quantity,
    isKit: Boolean(item.kitId),
    kitItems: (item.kitItems || []).map((kitItem, kitItemIndex) => ({
      kitItemIndex,
      name: kitItem.name,
      category: kitItem.category,
      subcategory: kitItem.subcategory,
      qty: kitItem.qty,
      // The parent's actual pick, not the school's full menu of options — this
      // is what to pack. `attributes.color` is a legacy single free-text value
      // from before per-parent color selection existed; there's no equivalent
      // fallback for size since it was always a list of options, never one value.
      size: kitItem.selectedSize || null,
      color: kitItem.selectedColor || kitItem.attributes?.color || null,
      packed: Boolean(kitItem.packed),
    })),
  }));

export const mapVendorOrderForList = (order) => {
  const amountPaise = sumVendorItemsPaise(order) || order?.totalPaise || 0;

  return {
    id: order?.orderNumber,
    mongoId: order?._id?.toString?.() || order?.id,
    deliveryDate: formatOrderDateShort(order?.deliveredAt || order?.placedAt),
    orderDate: formatOrderDateShort(order?.placedAt || order?.audit?.createdAt),
    status: formatOrderStatus(order?.orderStatus),
    statusRaw: order?.orderStatus,
    statusColor: getVendorOrderStatusStyle(order?.orderStatus),
    amount: paiseToRupees(amountPaise),
    school: order?.address?.name || order?.address?.city || 'Customer',
    phone: order?.address?.phone || '—',
    email: order?.address?.email || '—',
    website: '',
    timeSlot: order?.deliveryType === 'school' ? 'School Pickup' : 'Home Delivery',
    items: mapVendorOrderItems(order?.items || []).slice(0, 5),
    ...mapPaymentSplit(order),
    raw: order,
  };
};

export const mapVendorOrderForDetail = (order) => {
  const items = order?.vendorItems || order?.items || [];
  const amountPaise = sumVendorItemsPaise({ ...order, vendorItems: items });

  return {
    ...mapVendorOrderForList(order),
    items: mapVendorOrderItems(items),
    amount: paiseToRupees(amountPaise),
    address: [order?.address?.line1, order?.address?.city, order?.address?.pinCode]
      .filter(Boolean)
      .join(', '),
    paymentMethod: order?.paymentMethod === 'online' ? 'ONLINE PAYMENT' : 'CASH ON DELIVERY',
    raw: order,
  };
};

// `order` (the mapped shape from above) is optional and only consulted for
// the 'delivered' action — an RFQ order whose remainder is still outstanding
// gets that action rendered disabled, with the reason surfaced, rather than
// letting the vendor tap it and hit the backend's RFQ_REMAINDER_NOT_PAID error.
export const getVendorOrderActions = (status = '', order = {}) => {
  const normalized = String(status).toLowerCase();
  if (normalized === 'placed') {
    return [
      { key: 'accept', label: 'Accept Order', variant: 'primary' },
      { key: 'reject', label: 'Reject Order', variant: 'danger' },
    ];
  }
  if (normalized === 'accepted') {
    return [{ key: 'process', label: 'Start Processing', variant: 'primary' }];
  }
  if (normalized === 'processed') {
    return [{ key: 'dispatch', label: 'Mark Ready for Dispatch', variant: 'primary' }];
  }
  if (normalized === 'packed') {
    return [{ key: 'shipped', label: 'Mark Shipped', variant: 'primary' }];
  }
  if (normalized === 'shipped') {
    return [{ key: 'out_for_delivery', label: 'Out for Delivery', variant: 'primary' }];
  }
  if (normalized === 'out_for_delivery') {
    const remainderOutstanding = order?.isRfqOrder && !order?.remainderPaid;
    return [{
      key: 'delivered',
      label: remainderOutstanding ? 'Mark Delivered (Remaining Payment Pending)' : 'Mark Delivered',
      variant: 'primary',
      disabled: remainderOutstanding,
      disabledReason: remainderOutstanding
        ? 'The school still owes the remaining quotation payment — this unlocks once it is paid.'
        : null,
    }];
  }
  return [];
};

export const formatVendorAmount = (rupees) => formatRupee(Number(rupees || 0) * 100);

export const VENDOR_STATUS_FILTER_OPTIONS = [
  { label: 'All Status', value: '' },
  { label: 'Placed', value: 'placed' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Processing', value: 'processed' },
  { label: 'Packed', value: 'packed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
];
